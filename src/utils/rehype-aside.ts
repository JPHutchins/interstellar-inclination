import { visit, SKIP } from "unist-util-visit";
import { Node } from "unist";
import { Element } from "hast";

interface Parent extends Node {
	children: Node[];
}

interface TextNode extends Node {
	type: "text";
	value: string;
}

function isTextNode(node: Node): node is TextNode {
	return node.type === "text";
}

function isElement(node: Node): node is Element {
	return node.type === "element";
}

export default function rehypeAside() {
	return (tree: Node) => {
		visit(tree, "element", (node: Element, index: number | null, parent: Parent | null) => {
			if (node.tagName === "blockquote" && parent) {
				let type = "quote";
				let asideChildren: Node[] = [];
				let foundMarker = false;

				// Loop through children to extract the type and collect content
				for (let child of node.children) {
					if (
						!foundMarker &&
						isElement(child) &&
						child.tagName === "p" &&
						child.children.length > 0 &&
						isTextNode(child.children[0])
					) {
						const textNode = child.children[0];
						const match = textNode.value.match(
							/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
						);

						if (match) {
							type = match[1].toLowerCase();
							foundMarker = true;

							// Remove the marker and any following whitespace
							const cleanedText = textNode.value.replace(match[0], "");
							if (cleanedText.trim()) {
								textNode.value = cleanedText;
							} else {
								// Remove the now-empty marker text node
								child.children.splice(0, 1);
							}

							// Whatever remains on the marker's line becomes the title
							if (child.children.length > 0) {
								child.properties = { ...child.properties, class: "aside-title" };
								asideChildren.push(child);
							}
							continue;
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
