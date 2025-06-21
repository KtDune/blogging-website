// importing tools

import Embed from "@editorjs/embed"
import List from "@editorjs/list"
import Image from "@editorjs/image"
import Header from "@editorjs/header"
import Quote from "@editorjs/quote"
import InlineCode from "@editorjs/inline-code"
import Delimiter from '@editorjs/delimiter';
import { uploadImage } from "../common/firebase"
import React from 'react';

const uploadByUrl = (e) => {
    let link = new Promise((resolve, reject) => {
        try {
            resolve(e)
        }
        catch (error) {
            reject(error)
        }
    })

    return link.then((url) => {
        return {
            success: 1,
            file: { url },
        }
    })
}

const uploadByFile = async (e) => {
    return uploadImage(e)
        .then(imageUrl => {
            if (imageUrl) {
                return {
                    success: 1,
                    file: { url: imageUrl }
                };
            }
        });
};

export const toolBar = {
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true,
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadByUrl,
                uploadByFile: uploadByFile,
            }
        }
    },
    header: {
        class: Header,
        config: {
            placeholder: "Type heading...",
            levels: [2, 3],
            defaultLevel: 2,
        }
    },
    quote: {
        class: Quote,
        inlineToolbar: true,
    },
    delimiter: Delimiter,
    inlineCode: InlineCode,
}

// Helper to parse attributes inside tag string
function parseAttributes(str) {
    const attrRegex = /(\w+)=["'](.*?)["']/g;
    const attrs = {};
    let match;
    while ((match = attrRegex.exec(str))) {
        const key = match[1];
        const value = match[2];
        attrs[key === 'class' ? 'className' : key] = value;
    }
    return attrs;
}

// Helper to split on <br> but first normalize &nbsp;
function splitContentByBr(content) {
    // 1️⃣ Replace all `&nbsp;` with a normal space
    content = content.replace(/&nbsp;/g, ' ');

    // 2️⃣ Split on every <br> or <br /> (case‑insensitive)
    const parts = content.split(/<br\s*\/?>/i);
    const nodes = [];

    parts.forEach((part, idx) => {
        // also trim off any leftover whitespace
        const txt = part.trim();
        if (txt) {
            // If it looks like HTML, recurse; otherwise just text
            const node = txt.startsWith('<')
                ? parseHTMLString(txt)
                : txt;
            nodes.push(node);
        }
        if (idx < parts.length - 1) {
            nodes.push(React.createElement('br', { key: `br-${idx}` }));
        }
    });

    if (nodes.length === 1) {
        return nodes[0];
    }
    return React.createElement(React.Fragment, null, ...nodes);
}


// Recursive parser with &nbsp; normalization
export function parseHTMLString(str) {
    // 1️⃣ Normalize all `&nbsp;` → space, then trim
    str = str.replace(/&nbsp;/g, ' ').trim();

    // 2️⃣ If it’s plain text (no leading `<`), maybe contains <br>
    if (!str.startsWith('<')) {
        return str.includes('<br')
            ? splitContentByBr(str)
            : str;
    }

    // 3️⃣ Otherwise it must be a single root tag
    const tagRegex = /^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/i;
    const match = str.match(tagRegex);
    if (!match) {
        throw new Error('Invalid HTML format');
    }

    const [, tag, attrString, innerContent] = match;
    const attributes = parseAttributes(attrString);

    // 4️⃣ Recurse into the inner content (also normalized for &nbsp;)
    const children = splitContentByBr(innerContent);

    return React.createElement(tag, attributes, children);
}
