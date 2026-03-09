import { useState, useEffect } from "react";

// Module-level cache — persists across ALL renders and remounts for the session.
const globalCache = {};

/**
 * useTranslate(textsObject)
 *
 * Pass a plain object of English strings:
 *   { title: "My Diary", record_btn: "Record Entry" }
 *
 * Returns the same object with values translated into the
 * patient's preferred language (localStorage "patient_language").
 *
 * - English: zero network requests, instant.
 * - Non-English: one POST to /api/translate/ per unique batch per language.
 *   Results are cached globally — subsequent renders/remounts are instant.
 * - Fetch is NOT aborted on unmount; result still gets cached for next mount.
 * - Falls back to English silently if any error occurs.
 */
export function useTranslate(textsObject) {
    const lang = localStorage.getItem("patient_language") || "en";

    // Stable cache key: language + all English values joined
    const cacheKey = lang + "|" + Object.values(textsObject).join("|");

    // Initialise with cached value (instant) or English original (shown while loading)
    const [translated, setTranslated] = useState(
        () => globalCache[cacheKey] || textsObject
    );

    useEffect(() => {
        // English — no API call needed
        if (lang === "en") {
            setTranslated(textsObject);
            return;
        }

        // Cache hit — update state and exit
        if (globalCache[cacheKey]) {
            setTranslated(globalCache[cacheKey]);
            return;
        }

        // Track mount status — do NOT abort the fetch itself so the result
        // is cached even if the component unmounts before the response arrives.
        let isMounted = true;

        fetch("/api/translate/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ texts: textsObject, lang }),
        })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                // Save to global cache regardless of mount status
                globalCache[cacheKey] = data;
                if (isMounted) setTranslated(data);
            })
            .catch(() => {
                // LibreTranslate down or network error — silently keep English
                if (isMounted) setTranslated(textsObject);
            });

        return () => {
            isMounted = false; // prevent stale state update, but DON'T abort fetch
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang, cacheKey]);

    return translated;
}
