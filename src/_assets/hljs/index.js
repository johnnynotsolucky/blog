import hljs from "highlight.js/lib/core"
import plaintext from "highlight.js/lib/languages/plaintext"
import php from "highlight.js/lib/languages/php"
import javascript from "highlight.js/lib/languages/javascript"
import bash from "highlight.js/lib/languages/bash"

hljs.registerLanguage("plaintext", plaintext)
hljs.registerLanguage("php", php)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("javascript", javascript)

hljs.initHighlightingOnLoad()

document
	.getElementsByTagName("html")[0]
	.addEventListener("turbo:render", (e) => {
		document.querySelectorAll("pre code").forEach((block) => {
			hljs.highlightBlock(block)
		})
	})
