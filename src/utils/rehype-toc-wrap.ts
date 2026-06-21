import { visit, SKIP } from "unist-util-visit";
import { Node } from "unist";
import { Element } from "hast";

interface Parent extends Node {
	children: Node[];
}

function isElement(node: Node): node is Element {
	return node.type === "element";
}

export default function rehypeTocWrap() {
	return (tree: Node) => {
		visit(tree, "element", (node: Element, index: number | null, parent: Parent | null) => {
			if (
				node.tagName !== "h2" ||
				node.properties?.id !== "table-of-contents" ||
				index === null ||
				!parent
			) {
				return;
			}

			let listIndex = index + 1;
			while (listIndex < parent.children.length && !isElement(parent.children[listIndex])) {
				listIndex++;
			}

			const list = parent.children[listIndex];
			if (!list || !isElement(list) || list.tagName !== "ul") {
				return;
			}

			const wrapper: Element = {
				type: "element",
				tagName: "nav",
				properties: { class: "toc" },
				children: [node, list],
			};
			parent.children.splice(index, listIndex - index + 1, wrapper);

			return SKIP;
		});
	};
}
