function formatErrorsAsSentences(errors = []) {
    const rmSlash = (p) => (p || "").replace(/^\/+/, "");
    const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    return errors.map((e, idx) => {
        const inst = e.instancePath || "";
        const missing = e.params && e.params.missingProperty ? e.params.missingProperty : null;
        const combinedPath = inst + (missing ? `/${missing}` : "");
        const path = rmSlash(combinedPath);
        const atPath = path ? `${path} ` : "";
        switch (e.keyword) {
            case "required":
                return `${idx + 1}. ${inst ? `${rmSlash(inst)} is missing required property '${missing}'.` : `Missing required property '${missing}'.`}`;
            case "additionalProperties":
                return `${idx + 1}. ${inst ? `${rmSlash(inst)} has unexpected property '${e.params.additionalProperty}'.` : `Unexpected property '${e.params.additionalProperty}' found.`}`;
            case "type":
                return `${idx + 1}. ${atPath}must be of type '${e.params.type}'.`;
            case "format":
                return `${idx + 1}. ${atPath}must match format '${e.params.format}'.`;
            case "enum":
                return `${idx + 1}. ${atPath}must be one of: ${e.params.allowedValues.join(", ")}.`;
            case "minLength":
                return `${idx + 1}. ${atPath}must have at least ${e.params.limit} characters.`;
            case "maxLength":
                return `${idx + 1}. ${atPath}must have at most ${e.params.limit} characters.`;
            case "minimum":
                return `${idx + 1}. ${atPath}must be >= ${e.params.limit}.`;
            case "maximum":
                return `${idx + 1}. ${atPath}must be <= ${e.params.limit}.`;
            case "minItems":
                return `${idx + 1}. ${atPath}must have at least ${e.params.limit} items.`;
            case "maxItems":
                return `${idx + 1}. ${atPath}must have at most ${e.params.limit} items.`;
            case "pattern":
                return `${idx + 1}. ${atPath}must match pattern ${e.params.pattern}.`;
            default:
                return `${idx + 1}. ${path ? `${path} ${e.message}.` : `${cap(e.message || "validation error")}.`}`;
        }
    });
}

module.exports = { formatErrorsAsSentences };
