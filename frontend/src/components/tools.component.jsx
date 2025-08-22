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
// TODO: Fix vulnerabilities inside https://github.com/KtDune/blogging-website/security/dependabot, fix high risk issue would do.
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

export const deleteImage = async (url, access_token) => {
    try {
        const { data } = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/delete-image`,
            { url },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                }
            }
        )

        if (data?.result) {
            return { success: 1 }
        }
        else {
            return { success: 0 }
        }
    }
    catch (err) {
        const error = err?.response?.data?.error || err.message;
        console.error(error)
    }
}

// Extend the image tool to enhance the image removal lifecycle
class CustomImage extends Image {
    constructor(editorConfig) {
        super(editorConfig)

        this.access_token = editorConfig?.config?.access_token
    }

    removed() {
        const { file: { url } } = this._data
        deleteImage(url, this.access_token);
    }
}

// toolbarConfig.js
export const getToolBar = (access_token) => ({
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true,
    },
    image: {
        class: CustomImage,
        config: {
            access_token,
            uploader: {
                uploadByUrl: uploadByUrl,
                uploadByFile: (file) => uploadByFile(file, access_token),
            },
        },
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

export const fetchNotifications = async ({ page, filter, access_token, deletedDocCount = 0 }) => {
    try {
        const { data } = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/notifications`,
            { page, filter, deletedDocCount },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        )
        return data
    } catch (error) {
        console.error(error.response?.data?.error || error.message)
        return []
    }
}

export const fetchBlogInManage = async ({ page, query, draft, access_token }) => {

    try {

        const { data } = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/user-written-blogs`,
            { page, query, draft },
            { headers: { Authorization: `Bearer ${access_token}` } })

        return data

    }
    catch (error) {
        console.econsole.error(error.response?.data?.error || error.message)
        return []
    }

}