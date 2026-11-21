import { enMessages } from "@/i18n/locales/en";
import { ptMessages } from "@/i18n/locales/pt";
export function getMessagesForLocale(locale) {
    return locale === "en" ? enMessages : ptMessages;
}
export { enMessages, ptMessages };
