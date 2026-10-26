/** Lokale Bestätigungsfläche. Kein globales Stylesheet. */
export const USER_MUTATION_CONFIRMATION_CSS = `
.user-mutation-confirmation,
.user-mutation-feedback {
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.user-mutation-confirmation__dialog,
.user-mutation-feedback {
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  margin-top: 0.75rem;
  padding: 1rem;
  border: 1px solid rgb(var(--border));
  border-radius: 1rem;
  background: rgb(var(--card));
  color: rgb(var(--card-foreground));
}
.user-mutation-confirmation__title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
  font-weight: 600;
}
.user-mutation-confirmation__line,
.user-mutation-feedback p {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
}
.user-mutation-confirmation__hold {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
}
.user-mutation-confirmation__actions,
.user-mutation-feedback__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 100%;
  margin-top: 0.75rem;
}
.user-mutation-confirmation__button {
  box-sizing: border-box;
  min-height: 44px;
  max-width: 100%;
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--border));
  background: rgb(var(--background));
  color: rgb(var(--foreground));
  font: inherit;
  line-height: 1.3;
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.user-mutation-confirmation__button:focus-visible {
  outline: 2px solid rgb(var(--ring));
  outline-offset: 2px;
}
.user-mutation-confirmation__button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.user-mutation-confirmation__button--primary {
  border-color: transparent;
  background: rgb(var(--primary));
  color: rgb(var(--primary-foreground));
}
`
