/** Mensagens de autenticação: nunca mostrar respostas técnicas do servidor na UI. */
export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  switch (code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos. Confira seus dados e tente novamente.';
    case 'email_not_confirmed':
      return 'Confirme seu e-mail antes de entrar. Você pode pedir um novo código abaixo.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Já existe uma conta com este e-mail. Entre com sua senha.';
    case 'weak_password':
      return 'Escolha uma senha mais forte, com pelo menos 8 caracteres.';
    case 'otp_expired':
      return 'O código expirou ou está incorreto. Confira ou peça um novo código.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    case 'signup_disabled':
      return 'O cadastro está indisponível no momento. Você pode entrar como visitante.';
    default:
      if (error instanceof Error && /network|fetch|timeout/i.test(error.message)) {
        return 'Não foi possível conectar. Confira sua internet e tente novamente.';
      }
      return 'Não foi possível concluir. Tente novamente em instantes ou entre como visitante.';
  }
}
