// importing tools

import Embed from "@editorjs/embed"
import List from "@editorjs/list"
import Image from "@editorjs/image"
import Header from "@editorjs/header"
import Quote from "@editorjs/quote"
import InlineCode from "@editorjs/inline-code"
import Delimiter from '@editorjs/delimiter';
import { uploadImage } from "../common/firebase"
import React, { useContext, useMemo } from 'react';
import axios from "axios"
import DOMPurify from "dompurify"
import { UserContext } from "../App"

// TODO: Set maximum upload file size in firebase
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

const uploadByFile = async (e, access_token) => {
    const imageUrl = await uploadImage(e, access_token);

    if (imageUrl) {
        return {
            success: 1,
            file: { url: imageUrl }
        };
    }

    return {
        success: 0,
        file: null
    };
}

// toolbarConfig.js
export const getToolBar = (access_token) => ({
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
                uploadByFile: (file) => uploadByFile(file, access_token),
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
})

export const parseHTMLString = (html) => {

    const reactElements = useMemo(() => {
      const parser = new DOMParser()

      const sanitizedHtml = DOMPurify.sanitize(html)
      const doc = parser.parseFromString(sanitizedHtml, 'text/html');
      const body = doc.body
  
      const convertNodeToReact = (node, key) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
  
        const children = Array.from(node.childNodes).map((child, i) =>
          convertNodeToReact(child, i)
        );
  
        return React.createElement(node.tagName.toLowerCase(), { key }, ...children);
      };
  
      return Array.from(body.childNodes).map((node, index) =>
        convertNodeToReact(node, index)
      );
    }, [html])
  
    return <>{reactElements}</>
  }

export const fetchComments = async ({ skip = 0, blog_id, replyingTo = undefined }) => {
    try {
        const { data } = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-blog-comments`, {
            skip,
            blog_id,
            replyingTo
        })

        return data
    } catch (error) {
        console.error(error.message)
        return [] // or null or throw error again depending on your design
    }
}