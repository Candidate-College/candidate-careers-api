import { Request } from 'express';
import { AuthenticatedRequest, JsonResponse } from '@/types/express-extension';

const logger = require('@/utilities/logger');
const authService = require('@/services/auth-service');
const roleService = require('@/services/role-service');

exports.register = async (req: Request, res: JsonResponse) => {
  const { email, role_id } = req.body;

  try {
    if (await authService.findUserByEmail(email)) {
      return res.error(409, 'User already registered');
    }

    if (!await roleService.findRoleById(role_id)) {
      return res.error(404, 'Role not found');
    }

    const user = await authService.register(req.body);

    return res.success(
      'User registered successfully. Verification email sent.',
      user,
    );
  } catch (error: any) {
    logger.error('auth@register', error);
    return res.error();
  }
};

exports.verifyEmail = async (req: Request, res: JsonResponse) => {
  const { token } = req.body;

  try {
    // const decodedToken = 

    if (!await authService.findUserById(token)) {
      return res.error(400, 'Invalid verification token');
    }

    return res.success('');
  } catch (error: any) {
    logger.error('auth@verifyEmail', error);
    return res.error();
  }
};



exports.login = async (req: Request, res: JsonResponse) => {
  const { email, password } = req.body;
  
  try {
    const user = await authService.findUserByEmail(email);

    if (!user) {
      return res.error(401, 'Invalid credentials');
    }

    if (!authService.verify(password, user.password)) {
      return res.error(401, 'Invalid credentials');
    }

    const { session, ...authenticated } = await authService.authenticate(req, user);

    res.setCookie('refresh_token', session.token);

    return res.success('Successfully logged in!', authenticated);
  } catch (error: any) {
    logger.error('auth@login', error);
    return res.error();
  }
};

exports.refresh = async (req: AuthenticatedRequest, res: JsonResponse) => {
  const oldSession = req.user?.session;

  try {
    // if refresh token not found, then return error response
    const userSession = await authService.findActiveUserSessionById(oldSession?.id);
    if (!userSession) {
      return res.error(401, 'User session not found');
    }

    const user = await authService.findUserById(userSession.user_id);
    if (!user) {
      return res.error(401, 'User not found');
    }
    
    // refresh the access token
    const { session, ...validated } = await authService.revalidate(req, user, userSession);

    res.setCookie('refresh_token', session.token);

    return res.success('Successfully refreshed access token!', validated);
  } catch (error: any) {
    logger.error('auth@refresh', error);
    return res.error();
  }
};

exports.logout = async (req: AuthenticatedRequest, res: JsonResponse) => {
  const session = req.user?.session;

  try {
    const userSession = await authService.findActiveUserSessionById(session?.id);
    if (!userSession) {
      return res.error(404, 'User session not found');
    }

    const user = await authService.findUserById(userSession.user_id);
    if (!user) {
      return res.error(404, 'User not found');
    }

    const revokedUser = await authService.logout(user, userSession);

    res.clearCookie('refresh_token');

    return res.success('Successfully logged out!', revokedUser);
  } catch (error: any) {
    logger.error('auth@logout', error);
    return res.error();
  }
}
