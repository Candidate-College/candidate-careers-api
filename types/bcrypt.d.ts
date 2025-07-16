declare module 'bcrypt' {
  export function hashSync(data: string | Buffer, saltOrRounds: string | number): string;
}
