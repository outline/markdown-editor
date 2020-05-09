import { Plugin } from "prosemirror-state";
import copy from "copy-to-clipboard";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node as ProsemirrorNode, NodeType } from "prosemirror-model";
import { textblockTypeInputRule } from "prosemirror-inputrules";
import { setBlockType } from "prosemirror-commands";
import { MarkdownSerializerState } from "prosemirror-markdown";
import backspaceToParagraph from "../commands/backspaceToParagraph";
import toggleBlockType from "../commands/toggleBlockType";
import headingToSlug from "../lib/headingToSlug";
import Node from "./Node";

export default class Heading extends Node {
  get name() {
    return "heading";
  }

  get defaultOptions() {
    return {
      levels: [1, 2, 3, 4],
    };
  }

  get schema() {
    return {
      attrs: {
        level: {
          default: 1,
        },
      },
      content: "inline*",
      group: "block",
      defining: true,
      draggable: false,
      parseDOM: this.options.levels.map(level => ({
        tag: `h${level}`,
        attrs: { level },
      })),
      toDOM: node => {
        const button = document.createElement("button");
        button.innerText = "#";
        button.type = "button";
        button.className = "heading-anchor";
        button.addEventListener("click", this.handleCopyLink());

        return [
          `h${node.attrs.level + (this.options.offset || 0)}`,
          button,
          ["span", 0],
        ];
      },
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: ProsemirrorNode) {
    state.write(state.repeat("#", node.attrs.level) + " ");
    state.renderInline(node);
    state.closeBlock(node);
  }

  parseMarkdown() {
    return {
      block: "heading",
      getAttrs: (token: Record<string, any>) => ({
        level: +token.tag.slice(1),
      }),
    };
  }

  commands({ type, schema }) {
    return (attrs: Record<string, any>) => {
      return toggleBlockType(type, schema.nodes.paragraph, attrs);
    };
  }

  handleCopyLink = () => {
    return event => {
      // this is unfortunate but appears to be the best way to grab the anchor
      // as it's added directly to the dom by a decoration.
      const slug = `#${event.target.parentElement.parentElement.name}`;

      // the existing url might contain a hash already, lets make sure to remove
      // that rather than appending another one.
      const urlWithoutHash = window.location.href.split("#")[0];
      copy(urlWithoutHash + slug);

      if (this.options.onShowToast) {
        this.options.onShowToast("Link copied to clipboard");
      }
    };
  };

  keys({ type }: { type: NodeType }) {
    const options = this.options.levels.reduce(
      (items, level) => ({
        ...items,
        ...{
          [`Shift-Ctrl-${level}`]: setBlockType(type, { level }),
        },
      }),
      {}
    );

    return {
      ...options,
      Backspace: backspaceToParagraph(type),
      //Tab: splitBlock,
    };
  }

  get plugins() {
    return [
      new Plugin({
        props: {
          decorations: state => {
            const { doc } = state;
            const decorations: Decoration[] = [];
            const index = 0;

            doc.descendants((node, pos) => {
              if (node.type.name !== this.name) return;

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  name: headingToSlug(node, index),
                  class: "heading-name",
                  nodeName: "a",
                })
              );
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  }

  inputRules({ type }: { type: NodeType }) {
    return this.options.levels.map(level =>
      textblockTypeInputRule(new RegExp(`^(#{1,${level}})\\s$`), type, () => ({
        level,
      }))
    );
  }
}
