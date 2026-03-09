import { useTranslate } from "../hooks/useTranslate";

/**
 * <T text="Hello world" />
 * Renders a single translated string inline.
 * Shows the English original while the translation loads (no flash).
 */
export function T({ text }) {
    const result = useTranslate({ v: text });
    return <>{result.v}</>;
}
