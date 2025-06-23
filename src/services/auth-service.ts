import { Request } from 'express';
import { IssuedUserSession } from '@/types/express-extension';
import { User, UserData } from '@/models/user-model';
import { UserSession, UserSessionData } from '@/models/user-session-model';
const crypto = require('@/utilities/crypto');
const jwt = require('@/utilities/jwt');
const string = require('@/utilities/string');
const jwtConfig = require('@/config/jwt');
const toResource = require('@/utilities/resource');
const userResource = require('@/resources/user-resource');

exports.findUserById = async (
  id: number,
): Promise<UserData | null> => {
  return await User.query().findById(id);
}

exports.findUserByEmail = async (
  email: string,
): Promise<UserData | null> => {
  return await User.query().findOne({ email });
};

exports.findActiveUserSessionById = async (
  sessionId: string,
): Promise<UserSessionData | null> => {
  return await UserSession.query()
    .findById(sessionId)
    .where('is_active', true);
};

exports.register = async (
  user: UserData,
): Promise<UserData> => {
  return await User.query().insert(user);
};

exports.verify = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await crypto.compare(password, hashedPassword);
};

interface AuthData {
  user: Partial<UserData>;
  token: {
    type: string;
    access: string;
    expiresIn: string;
  };
  session: {
    id: string;
    user_id: number;
    token: string;
  };
}

/**
 * Authenticate user and persist session
 */
exports.authenticate = async (
  req: Request,
  user: UserData,
): Promise<AuthData> => {;
  const authData = await setAuthData(user, string.generateUUID());
  await persistSession(req, authData);
  return authData;
};

/**
 * Persist user session
 */
const persistSession = async (
  req: Request,
  auth: AuthData,
) => {
  await UserSession.query().insert({
    id: auth.session.id,
    user_id: auth.session.user_id,
    user_agent: req.headers['user-agent'],
    ip_address: req.ip,
  });
};
exports.persistSession = persistSession;

/**
 * Revalidate user session
 */
exports.revalidate = async (
  req: Request,
  user: UserData,
  oldSession: IssuedUserSession,
): Promise<AuthData> => {
  const newSessionId = string.generateUUID();

  const authData = await setAuthData(user, newSessionId, oldSession.exp);
  await persistSession(req, authData);

  await UserSession.query()
    .findById(oldSession.id)
    .patch({
      is_active: false,
      last_used_at: new Date(),
      replaced_by: newSessionId,
    });

  return authData;
};

/**
 * Logs user out of the session
 */
exports.logout = async (
  user: UserData,
  userSession: UserSessionData,
): Promise<Partial<UserData>> => {
  await UserSession.query().findById(userSession.id).patch({
    is_active: false,
    revoked_at: new Date(),
  });

  return toResource(user, userResource);
};

/**
 * Generates authenticated user data
 * 
 * @param user 
 * @param sessionId 
 * @param sessionTtl 
 * @returns 
 */
const setAuthData = async (
  user: UserData,
  sessionId: string,
  sessionExp?: number,
): Promise<AuthData> => {
  // filter visible columns for access token
  const visibleColumns = ['id', 'email', 'role'];
  const userData = await toResource(user, { only: visibleColumns });

  // sign tokens
  const accessToken = jwt.access.sign(userData);
  let refreshToken;
  if (sessionExp) {
    // rotate refresh token
    refreshToken = jwt.refresh.sign({ id: sessionId }, sessionExp);
  } else {
    refreshToken = jwt.refresh.sign({ id: sessionId });
  }

  return {
    user: await toResource(user, userResource),
    token: {
      type: 'bearer',
      access: accessToken,
      expiresIn: jwtConfig.access.ttl,
    },
    session: {
      id: sessionId,
      user_id: user.id,
      token: refreshToken,
    }
  };
};
