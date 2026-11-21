import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
/** Maps common Supabase Auth English messages to Portuguese for the UI. */
export function authErrorMessage(message) {
    const m = message.toLowerCase();
    if (m.includes("email rate limit") || m.includes("rate limit exceeded")) {
        return "Limite de e-mails atingido. Aguarde alguns minutos antes de tentar de novo ou use outro endereço.";
    }
    if (m.includes("password should be at least")) {
        return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (m.includes("invalid login credentials")) {
        return "E-mail ou senha incorretos.";
    }
    if (m.includes("user already registered")) {
        return "Este e-mail já está cadastrado.";
    }
    return message;
}
