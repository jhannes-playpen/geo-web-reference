import * as React from "react";

export function Popup(props: {
  popupLocation: { x: number; y: number };
  country: string | undefined;
}) {
  return (
    <div
      className={"popup"}
      style={{
        top: `${props.popupLocation.y}px`,
        left: `${props.popupLocation.x}px`,
      }}
    >
      <div className={"content"}>
        <h3>{props.country}</h3>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Debitis
      </div>
    </div>
  );
}
