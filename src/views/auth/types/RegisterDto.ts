export interface RegisterRequest {
  name: string;
  email: string;
  companyName: string;
  companyDomain?: string;
  password: string;
}

export interface RegisterDto extends RegisterRequest {
  confirmPassword: string;
}