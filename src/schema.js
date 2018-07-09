// @flow
import { Block, Change, Node, Mark } from "slate";

type Options = {
  title: boolean,
};

const schema = ({ title }: Options) => {
  const nodes = [
    {
      types: [
        "paragraph",
        "heading1",
        "heading2",
        "heading3",
        "heading4",
        "heading5",
        "heading6",
        "block-quote",
        "code",
        "horizontal-rule",
        "image",
        "bulleted-list",
        "ordered-list",
        "todo-list",
        "block-toolbar",
        "table",
      ],
      min: 1,
    },
  ];

  if (title) {
    nodes.unshift({ types: ["heading1"], min: 1, max: 1 });
  }

  return {
    blocks: {
      heading1: { nodes: [{ objects: ["text"] }], marks: [""] },
      heading2: { nodes: [{ objects: ["text"] }], marks: [""] },
      heading3: { nodes: [{ objects: ["text"] }], marks: [""] },
      heading4: { nodes: [{ objects: ["text"] }], marks: [""] },
      heading5: { nodes: [{ objects: ["text"] }], marks: [""] },
      heading6: { nodes: [{ objects: ["text"] }], marks: [""] },
      "block-quote": { marks: [""] },
      table: {
        nodes: [{ types: ["table-row", "table-head", "table-cell"] }],
      },
      "horizontal-rule": {
        isVoid: true,
      },
      "block-toolbar": {
        isVoid: true,
      },
    },
    document: {
      nodes,
      normalize: (
        change: Change,
        reason: string,
        {
          node,
          child,
          mark,
          index,
        }: { node: Node, mark?: Mark, child: Node, index: number }
      ) => {
        const insertHeading = title && index === 0;

        switch (reason) {
          case "child_type_invalid": {
            return change.setNodeByKey(
              child.key,
              insertHeading ? "heading1" : "paragraph"
            );
          }
          case "child_required": {
            const block = Block.create(
              insertHeading ? "heading1" : "paragraph"
            );
            return change.insertNodeByKey(node.key, index, block);
          }
          default:
        }
      },
    },
  };
};

export default schema;
