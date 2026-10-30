"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitVault, type VaultState } from "./actions";

export function VaultForm() {
  const t = useTranslations("Private");
  const [state, action, pending] = useActionState<VaultState, FormData>(submitVault, {});
  return (
    <form action={action} className="vault-form" autoComplete="off">
      <label htmlFor="vault-code" className="vault-form__label">{t("codeLabel")}</label>
      <input id="vault-code" name="code" className="vault-form__input" dir="ltr" inputMode="text" autoCapitalize="characters"
        autoCorrect="off" spellCheck={false} maxLength={16} required aria-describedby={state.error ? "vault-error" : undefined}
        aria-invalid={state.error ? true : undefined} />
      <button type="submit" className="vault-form__button" disabled={pending}>{t("submit")}</button>
      {state.error ? <p id="vault-error" role="alert" className="vault-form__error">{state.error === "limited" ? t("limitedBody") : t("invalid")}</p> : null}
    </form>
  );
}
