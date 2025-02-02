import DOM_FRAG from "./fragment";

const VELOX = new (function Velox() {})();
const CHILDREN_CONTAINERS = new WeakMap(); /* Symbol: DOM_Frag  */
const IS_INT = Number.isInteger;
const IS_ARRAY = Array.isArray;
const defineProp = Object.defineProperty;
const PENDING_UPDATES = new Set();
const CUSTOM_RENDER = {};
const LINK_EXP = "Link";
const ANCHOR_EXP = "a";
const CASE_EXP = "Case";
const caseFiltration = (CN) => IS_ARRAY(CN) && CN[0] === CASE_EXP;

let isUpdating = false,
  currentCTX = null;

VELOX.render = function (jsxRoot) {
  if (currentCTX) getError("main");
  const ctx = new Component(jsxRoot);
  return renderElementNode(ctx, jsxRoot.dom);
};

VELOX.useForce = function forceUpdate(fn) {
  if (typeof fn !== "function") throw getError("useForce");
  const ctx = currentCTX;
  return function () {
    fn();
    requestUpdate(ctx);
  };
};

export default VELOX;

function renderElementNode(ctx, vNode) {
  const [tag, props, children] = vNode;

  if (props.key) return resolveCache(ctx, vNode);
  else if (IS_INT(tag)) return renderComponent(ctx, vNode);
  else if (CUSTOM_RENDER[tag]) return CUSTOM_RENDER[tag](ctx, vNode);
  else if (tag === LINK_EXP) {
    vNode[0] = ANCHOR_EXP;
  }

  const el = document.createElement(tag),
    attrs = {};

  // ctx.applyAttributes(compareProps(props, attrs), el);

  for (let i = 0; i < children.length; ) {
    const childNode = ctx.createChildNode(children[i++]);
    childNode.constructor.name === "DOM_FRAG"
      ? childNode.appendTo(el)
      : el.appendChild(childNode);
  }

  return el;
}

function renderComponent(ctx, vNode) {
  const [tag, attrs, children] = vNode;

  let jsxRoot = ctx.components[tag];
  // if it's Children
  if (jsxRoot.constructor === DocumentFragment) return jsxRoot;
  else if (jsxRoot.constructor.name === "Function") {
    const keys = Object.keys(attrs),
      CTX = { effects: [] },
      props = {};

    let index = 0;
    while (index < keys.length) {
      const key = keys[index++],
        value = attrs[key];
      if (IS_INT(value)) {
        props[key] = ctx.scripts[value];
        ctx.observers.push(function () {
          const newVal = ctx.scripts[value];
          if (props[key] === newVal) return;
          props[key] = newVal;
          PENDING_UPDATES.add(CTX);
        });
      } else props[key] = value;
    }

    currentCTX = CTX;
    jsxRoot = jsxRoot(props);

    if (children.length) {
      const Children = new DOM_FRAG();

      index = 0;
      while (index < children.length)
        Children.insertNode(ctx.createChildNode(children[index++]));

      defineProp(props, "Children", {
        configurable: false,
        enumerable: false,
        writable: false,
        get() {
          // Children.reset()
          return Children.frag;
        },
      });
    }
  }

  const C = new Component(jsxRoot);
  currentCTX && (currentCTX.ctx = C);
  currentCTX = null;

  return renderElementNode(C, jsxRoot.dom);
}

function resolveCache(ctx, vNode) {
  const attrs = vNode[1],
    key = attrs.key;

  if (!key) return false;
  delete attrs.key;

  const observerStart = ctx.observers.length - 1;
  const result = renderElementNode(ctx, vNode);
  const observerEnd = ctx.observers.length - 1;

  ctx.cacheContainer[key] = {
    update() {},
    dom: result,
  };

  return Element;
}

CUSTOM_RENDER.Frag = function (ctx, vNode) {};

CUSTOM_RENDER.Switch = function (ctx, vNode) {};

// if (children) {
//   const DOMFrag = new DOM_FRAG();
//   let didRendered = false;

//   Object.defineProperty(attrs, "Children", {
//     get() {
//       if (!didRendered) {
//         children.forEach(appendChildNode);
//         didRendered = true;
//       }
//       return DOMFrag;
//     },
//   });

//   function appendChildNode(node) {
//     const childNode = SELF.createNode(node);
//     DOMFrag.append(childNode);
//   }
// }

/**
PROTO.checkCase = function (childNode) {
  const SELF = this,
    conditionRef = childNode[1].test || true;

  let container = null;

  return function () {
    const testRes = Number.isInteger(conditionRef)
      ? SELF.scripts[conditionRef]
      : Boolean(conditionRef);

    if (container === null) {
      const childNodes = childNode[2] || [];
      container = childNodes.map(SELF.createNode, SELF);
    }

    return testRes ? container : null;
  };
};

function renderSwitchCase(ctx, children) {
  const frag = new DOM_FRAG();
  const cases = children.filter(caseFiltration).map(ctx.checkCase, ctx);

  let index = 0;
  ctx.observers.push(updateContent);

  // set frag.currDOM
  return frag;

  function updateContent() {
    clearFrag(frag);
    while (cases.length > index) {
      const result = cases[index++]();
      if (result) {
        frag.currDOM = result;
        break;
      }
    }
    expandFrag(frag);
    index = 0;
  }
}
 */

function ChildrenContainer(S, M) {
  if (this.constructor !== ChildrenContainer)
    return new ChildrenContainer(S, M);
  this.symbol = S;
  this.map = M;
}
