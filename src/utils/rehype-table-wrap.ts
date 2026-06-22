import { visit, SKIP } from "unist-util-visit";
import { Node } from "unist";
import { Element } from "hast";

interface Parent extends Node {
	children: Node[];
}

export default function rehypeTableWrap() {
	return (tree: Node) => {
		visit(tree, "element", (node: Element, index: number | null, parent: Parent | null) => {
			if (node.tagName !== "table" || index === null || !parent) {
				return;
			}

			const wrapper: Element = {
				type: "element",
				tagName: "div",
				properties: {
					class: "table-wrapper",
					role: "region",
					tabindex: 0,
					"aria-label": "Table, scroll horizontally to see more",
				},
				children: [node],
			};
			parent.children.splice(index, 1, wrapper);

			return SKIP;
		});
	};
}
