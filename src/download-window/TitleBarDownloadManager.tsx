export function TitleBar() {
  const index = 0;
  return (
    <div
      id="titleBarContainer"
      className="absolute z-30 w-full bg-background text-text"
    >
      <div
        id="titleBar"
        className="draggable absolute top-0 flex h-full select-none items-center justify-between border-accent pl-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--background)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle
            cx="7.2"
            cy="14.4"
            r="6"
            fill={
              index % 3 === 0
                ? `var(--accent)`
                : index % 3 === 1
                  ? `var(--primary)`
                  : `var(--secondary)`
            }
          />
          <circle
            cx="16.8"
            cy="14.4"
            r="6"
            fill={
              index % 3 === 0
                ? `var(--secondary)`
                : index % 3 === 1
                  ? `var(--accent)`
                  : `var(--primary)`
            }
          />
          <circle
            cx="12"
            cy="7.2"
            r="6"
            fill={
              index % 3 === 0
                ? `var(--primary)`
                : index % 3 === 1
                  ? `var(--secondary)`
                  : `var(--accent)`
            }
          />
        </svg>
        <h1 className="text-3xl font-bold">Download Manager</h1>
        <div></div>
      </div>
    </div>
  );
}
