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

// (Keep parseHTMLString and parseAttributes as before)

function splitContentByBr(content) {
  // 1. Split on every <br> or <br /> (case‑insensitive)
  const parts = content.split(/<br\s*\/?>/i);
  const nodes = [];

  // 2. For each segment, parse it (nested HTML or plain text) and
  //    push into nodes[], interleaving <br /> elements.
  parts.forEach((part, idx) => {
    const txt = part.trim();
    if (txt) {
      // If it looks like HTML, recurse; otherwise just text
      const node = txt.startsWith('<')
        ? parseHTMLString(txt)
        : txt;
      nodes.push(node);
    }
    if (idx < parts.length - 1) {
      // Add an actual <br /> element
      // We do give it a key here, but it's only ever wrapped below.
      nodes.push(React.createElement('br', { key: `br-${idx}` }));
    }
  });

  // 3. If there's only one node, return it directly:
  if (nodes.length === 1) {
    return nodes[0];
  }

  // 4. Otherwise wrap them in one Fragment (a single React element)
  //    so parseHTMLString ends up with a single node, not an array.
  return React.createElement(React.Fragment, null, ...nodes);
}



// Recursive parser
export function parseHTMLString(str) {
    str = str.trim();

    // Base case: plain text, but check for <br>
    if (!str.startsWith('<')) {
        // New logic: split plain text with <br>
        if (str.includes('<br')) {
            return splitContentByBr(str);
        }
        return str;
    }

    const tagRegex = /^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/i;
    const match = str.match(tagRegex);
    if (!match) {
        throw new Error('Invalid HTML format');
    }

    const [, tag, attrString, innerContent] = match;
    const attributes = parseAttributes(attrString);

    const children = splitContentByBr(innerContent);

    return React.createElement(tag, attributes, children);
}
