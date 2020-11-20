import { EditorView } from "prosemirror-view";

function findPlaceholderLink(doc, href) {
  let result;

  function findLinks(node, pos = 0) {
    // get text nodes
    if (node.type.name === "text") {
      // get marks for text nodes
      node.marks.forEach(mark => {
        // any of the marks links?
        if (mark.type.name === "link") {
          // any of the links to other docs?
          if (mark.attrs.href === href) {
            result = { node, pos };
            if (result) return false;
          }
        }
      });
    }

    if (!node.content.size) {
      return;
    }

    node.descendants(findLinks);
  }

  findLinks(doc);
  return result;
}

const createAndInsertLink = async function(
  view: EditorView,
  title: string,
  href: string,
  options: {
    onCreateLink: (title: string, urlParams?: string) => Promise<string>;
    onShowToast?: (message: string, code: string) => void;
    readOnly?: boolean,
    urlParams: string
  }
) {
  const { dispatch, state } = view;
  const { onCreateLink, onShowToast, readOnly, urlParams } = options;

  try {
    const url = await onCreateLink(title, urlParams);
    const result = findPlaceholderLink(view.state.doc, href);

    if (!result || readOnly) return;

    dispatch(
      view.state.tr
        .removeMark(
          result.pos,
          result.pos + result.node.nodeSize,
          state.schema.marks.link
        )
        .addMark(
          result.pos,
          result.pos + result.node.nodeSize,
          state.schema.marks.link.create({ href: url })
        )
    );
  } catch (err) {
    const result = findPlaceholderLink(view.state.doc, href);
    if (!result) return;

    dispatch(
      view.state.tr.removeMark(
        result.pos,
        result.pos + result.node.nodeSize,
        state.schema.marks.link
      )
    );

    // let the user know
    if (onShowToast) {
      onShowToast(
        "Sorry, an error occurred creating the link",
        "link_create_error"
      );
    }
  }
};

export default createAndInsertLink;
