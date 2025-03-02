import { visit, SKIP } from "unist-util-visit";
import { Node } from "unist";
import { Element } from "hast";

interface Parent extends Node {
    children: Node[];
}

interface TextNode extends Node {
    value: string;
}

export default function rehypeAside() {
    return (tree: Node) => {
        visit(tree, "element", (node: Element, index: number | null, parent: Parent | null) => {
            if (node.tagName === "blockquote" && parent) {
                let type = "quote";
                let asideChildren: Node[] = [];

                // Loop through children to extract the type and collect content
                for (let child of node.children) {
                    if (
                        (child as Element).tagName === "p" &&
                        (child as Element).children.length > 0
                    ) {
                        const textNode = (child as Element).children[0] as TextNode;
                        const text = textNode.value || "";
                        const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

                        if (match) {
                            type = match[1].toLowerCase();
                            textNode.value = text.replace(match[0], "").trim();
                        }
                    }
                    asideChildren.push(child); // Add all content to the aside
                }

                if (type === "quote") {
                    parent.children[index!] = {
                        type: "element",
                        tagName: "blockquote",
                        properties: { class: `${type}` },
                        children: asideChildren,
                    };
                } else {
                    parent.children[index!] = {
                        type: "element",
                        tagName: "aside",
                        properties: { class: `aside ${type}` },
                        children: asideChildren,
                    };
                }

                return SKIP;
            }
        });
    };
}
