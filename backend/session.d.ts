import "express-session";

declare module "express-session" {
  interface SessionData {
    company_id: number;
    user_id: number,
    user_role: string;
    fullname: string;
    email: string;
  }
}
