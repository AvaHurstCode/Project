import sanitizeHtml from 'sanitize-html';

export function sanitize(input) {
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {}
    });
}