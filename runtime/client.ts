type InputProps = {
  kind: "txt" | "num" | "chk" | "sel";
  variable: string;
  options: string[]; // for select, otherwise empty
  align: "start" | "left" | "center" | "right" | "end";
  size: string;
  font: string;
  color: string;
  bounds: DOMRect;
  element: Element;
  defaultVal: string;
};
type SwapButtonProps = {
  kind: "swp";
  variable: string;
  element: Element;
  bounds: DOMRect;
};
type Props = InputProps | SwapButtonProps;

const root =
  new URL(window.location.href).searchParams.get("root") || "main.typ";

const typ = createDiv("typ");
const err = createDiv("err");
const ui = createDiv("ui");
const cm = createDiv("cm");
let mutexes: string[][] = []; // mutually exclusive values

function createDiv(id: string) {
  const element = document.createElement("div");
  element.id = id;
  document.body.appendChild(element);
  return element;
}

rebuild().then(loadFonts);
document.addEventListener("input", rebuild);
document.addEventListener("focuswithin", rebuild);
window.addEventListener("resize", rebuild);
document.addEventListener("scroll", replaceUi);

function rebuild(event?: Event) {
  const target = (event?.target as Element | undefined)?.id;
  if (target && event?.type === "input") {
    enforceMutex(target);
  }
  return replaceTyp(getUiValues()).then(replaceUi).then(setupMutex);
}

function getDefaultValues() {
  const element = Array.from(
    typ.querySelectorAll<HTMLElement>("[data-typst-label]"),
  ).find((el) => el.dataset.typstLabel?.startsWith("dyno.defaults:"));

  if (!element?.dataset.typstLabel) {
    console.warn("Default values not provided by the server");
    return {};
  }

  const raw = element.dataset.typstLabel.replace("dyno.defaults:", "");
  const pairs = raw.split(";").map((pair) => pair.split("="));
  return Object.fromEntries(pairs);
}

function setupMutex() {
  mutexes = Array.from(typ.querySelectorAll<HTMLElement>("[data-typst-label]"))
    .filter((el) => el.dataset.typstLabel?.startsWith("dyno.mutex:"))
    .map((el) => el.dataset.typstLabel!.replace("dyno.mutex:", "").split(";"));
}

function enforceMutex(targetId: string) {
  mutexes
    .filter((rule) => rule.includes(targetId))
    .flatMap((rule) => rule.filter((id) => id !== targetId))
    .map((id) => document.getElementById(id) as HTMLInputElement | null)
    .filter((el) => el !== null)
    .forEach((el) => {
      if (el.type === "checkbox") {
        el.checked = false;
      } else {
        el.value = "";
      }
    });
}

function loadFonts() {
  const requestedWithDuplicates = Array.from(
    ui.children as Iterable<HTMLInputElement>,
  )
    .map((element) => element.style.fontFamily.replaceAll('"', ""))
    .filter(Boolean);
  const requested = [...new Set(requestedWithDuplicates)];

  const fonts = requested.map(
    (name) => new FontFace(name, `url("/font?name=${name}")`),
  );

  fonts.map((font) => document.fonts.add(font));
}

async function replaceUi() {
  const defaultValues = getDefaultValues();

  const requested = Array.from(
    typ.querySelectorAll<HTMLElement>("[data-typst-label]"),
  )
    .map((el) => {
      try {
        return {
          ...JSON.parse(el.dataset.typstLabel!),
          bounds: el.getBoundingClientRect(),
          element: el,
        };
      } catch {
        return false;
      }
    })
    .filter(Boolean)
    .map((el): Props => {
      return {
        ...el,
        defaultVal: defaultValues[el.variable],
      };
    });
  const real = Array.from(ui.children);

  real
    .filter(
      (element) =>
        !requested.map(({ variable }) => variable).includes(element.id),
    )
    .map((element) => element.remove());
  requested.map(updateUiElement);
}

function getUiValues() {
  const pairs = Array.from(ui.children as Iterable<HTMLInputElement>)
    .map(getInputValue)
    .filter((element) => element.length !== 0);

  const system = [
    ["window-width", window.innerWidth],
    ["window-height", window.innerHeight],
    ["cm", cm.clientWidth],
    ["focus", `"${document.activeElement?.id || ""}"`],
  ];

  return (
    "#{\n" +
    [...pairs, ...system].map(([k, v]) => `  ${k} = ${v}`).join("\n") +
    "\n}"
  );
}

function getInputValue(element: HTMLInputElement) {
  const name = element.id;

  if (element.type === "number") {
    return [name, element.value || 0];
  } else if (
    element.type === "text" ||
    element.tagName.toLowerCase() === "select"
  ) {
    return [name, '"' + (element.value || "") + '"'];
  } else if (element.type === "checkbox") {
    return [name, element.checked || false];
  } else {
    return [];
  }
}

function setInputValue(
  element: HTMLInputElement,
  value: number | string | boolean,
) {
  if (typeof value === "boolean") {
    element.checked = value;
  } else {
    element.value = String(value);
  }
}

function updateUiElement(props: Props) {
  const element =
    document.getElementById(props.variable) || createUiElement(props);

  element.style.left = props.bounds.left + "px";
  element.style.width = props.bounds.width + "px";

  if (props.kind === "txt" || props.kind === "num" || props.kind === "sel") {
    element.style.top = (props.bounds.bottom + props.bounds.top) / 2 + "px";

    props.element
      .querySelectorAll(".typst-text")
      .forEach((obj) => obj.remove());
  } else {
    element.style.top = props.bounds.top + "px";
    element.style.height = props.bounds.height + "px";
  }

  if (props.kind !== "swp") {
    element.style.color = props.color;
    element.style.fontFamily = props.font;
    element.style.fontSize = props.size;
    element.style.textAlign = props.align;
  }
}

function createUiElement(props: Props) {
  if (props.kind === "swp") {
    return createSwapButton(props);
  }

  return createInput(props);
}

function createSwapButton(props: SwapButtonProps) {
  const [a, b] = props.variable.split(";");

  const element = document.createElement("button");
  element.classList.add("swp");
  element.id = props.variable;

  element.addEventListener("click", () => {
    const input1 = document.getElementById(a) as HTMLInputElement;
    const input2 = document.getElementById(b) as HTMLInputElement;
    const [_key1, value1] = getInputValue(input1);
    const [_key2, value2] = getInputValue(input2);
    setInputValue(input1, value2);
    setInputValue(input2, value1);
    element.dispatchEvent(new CustomEvent("input", { bubbles: true }));
  });

  ui.appendChild(element);

  return element;
}

function createInput({ kind, variable, options, defaultVal }: InputProps) {
  let element: HTMLInputElement | HTMLSelectElement;

  if (kind === "num") {
    element = document.createElement("input");
    element.type = "number";
    element.value = defaultVal;
  } else if (kind === "chk") {
    element = document.createElement("input");
    element.type = "checkbox";
    element.checked = defaultVal === "true";
  } else if (kind === "txt") {
    element = document.createElement("input");
    element.type = "text";
    element.value = defaultVal;
  } else if (kind === "sel") {
    element = document.createElement("select");
    options.forEach((name) => {
      const option = document.createElement("option");
      option.text = name;
      option.value = name;
      element.appendChild(option);
    });
  } else {
    element = document.createElement("input");
    console.warn("unknown element", kind);
  }

  element.id = variable;
  const sendFocusChange = () =>
    element.dispatchEvent(new CustomEvent("focuswithin", { bubbles: true }));
  element.onfocus = sendFocusChange;
  element.onblur = () => setTimeout(sendFocusChange, 100);
  ui.appendChild(element);
  return element;
}

async function replaceTyp(body: string) {
  const response = await fetch(`/compile?root=${root}`, {
    method: "POST",
    body: body || "// dyno: no input provided",
  });
  const text = await response.text();

  if (text.startsWith("<pre>")) {
    err.innerHTML = text;
  } else {
    err.innerHTML = "";
    typ.innerHTML = text;
  }
}
