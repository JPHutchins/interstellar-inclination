import type { RemarkPlugin } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import { Node } from "unist";

interface Parent extends Node {
    children: Node[];
}

interface CodeNode extends Node {
    type: "code";
    lang: string;
    value: string;
    meta?: string;
}

interface HtmlNode extends Node {
    type: "html";
    value: string;
}

interface ContainerDirective extends Node {
    type: "containerDirective";
    name: string;
    children: Node[];
    attributes?: Record<string, string>;
}

function isCodeNode(node: Node): node is CodeNode {
    return node.type === "code";
}

function isContainerDirective(node: Node): node is ContainerDirective {
    return node.type === "containerDirective";
}

export const remarkTabbedCode: RemarkPlugin<[]> = () => (tree) => {
    visit(
        tree,
        "containerDirective",
        (node: ContainerDirective, index: number | null, parent: Parent | null) => {
            if (node.name === "tabbed-code" && parent && index !== null) {
                const tabs: Array<{ label: string; language: string; node: CodeNode }> = [];

                // Extract tabs from child code blocks
                for (const child of node.children) {
                    if (isCodeNode(child)) {
                        // Parse meta for tab label: ```javascript tab="React"
                        let label = child.lang || "Code";
                        if (child.meta) {
                            const tabMatch = child.meta.match(/tab="([^"]+)"/);
                            if (tabMatch) {
                                label = tabMatch[1];
                            }
                        }

                        tabs.push({
                            label,
                            language: child.lang || "text",
                            node: child,
                        });
                    }
                }

                if (tabs.length > 0) {
                    // Generate unique ID for this component instance
                    const componentId = `tabbed-code-${Math.random().toString(36).slice(2, 11)}`;

                    // Create the wrapper structure and let the code blocks be processed normally
                    const wrapperStart: HtmlNode = {
                        type: "html",
                        value: `<div class="tabbed-code-container" data-component="${componentId}">
    <div class="tab-buttons">
        ${tabs
            .map(
                (tab, index) => `
            <button 
                class="tab-button${index === 0 ? " active" : ""}"
                data-tab="${index}"
            >
                ${tab.label}
            </button>
        `
            )
            .join("")}
    </div>
    <div class="tab-content">`,
                    };

                    const wrapperEnd: HtmlNode = {
                        type: "html",
                        value: `</div>
</div>

<script>
(function() {
    const container = document.querySelector('[data-component="${componentId}"]');
    if (!container) return;
    
    const buttons = container.querySelectorAll('.tab-button');
    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            // Remove active from all tabs in this component
            container.querySelectorAll('.tab-button, .tab-pane').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active to clicked button and corresponding pane
            button.classList.add('active');
            container.querySelector('[data-tab="' + index + '"].tab-pane').classList.add('active');
        });
    });
})();
</script>`,
                    };

                    // Create wrapped code blocks that will be processed by expressive-code
                    const wrappedCodeBlocks: Node[] = [];
                    tabs.forEach((tab, index) => {
                        wrappedCodeBlocks.push({
                            type: "html",
                            value: `<div class="tab-pane${
                                index === 0 ? " active" : ""
                            }" data-tab="${index}">`,
                        } as HtmlNode);
                        wrappedCodeBlocks.push(tab.node);
                        wrappedCodeBlocks.push({
                            type: "html",
                            value: `</div>`,
                        } as HtmlNode);
                    });

                    // Replace the directive with the wrapper and code blocks
                    parent.children.splice(
                        index,
                        1,
                        wrapperStart,
                        ...wrappedCodeBlocks,
                        wrapperEnd
                    );
                }
            }
        }
    );
};