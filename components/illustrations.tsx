export function Harbour({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 320"
      fill="none"
      role="img"
      aria-label="An original illustration of Hong Kong harbour, a ferry, and colourful buildings"
    >
      <circle cx="397" cy="71" r="40" fill="#F8C569" />
      <path
        d="M75 160V95h40v65m9 0V62h39v98m13 0V100h42v60m14 0V44h28v116m16 0V74h45v86m12 0V104h30v56m16 0V80h40v80m13 0V119h45v41"
        fill="#99B9AE"
      />
      <path d="M249 44V22m-12 22h24" stroke="#99B9AE" strokeWidth="5" />
      <path
        d="M47 192v-81h49v81m13 0v-40h53v40m164 0v-70h58v70m11 0v-98h51v98m13 0v-54h57v54"
        fill="#447D71"
      />
      <path d="M405 94V74" stroke="#447D71" strokeWidth="5" />
      <g fill="#F4EACD">
        <path d="M61 126h8v13h-8zm15 0h8v13h-8zm-15 24h8v13h-8zm15 0h8v13h-8zm340-37h8v13h-8zm-15 0h8v13h-8zm15 24h8v13h-8zm-15 0h8v13h-8z" />
      </g>
      <path d="M0 202c82-13 135 10 205-3s151-4 315 5v116H0z" fill="#B3D5C3" />
      <path
        d="M25 240h70m292-15h101M66 278h99m197 5h68m-224-14h119"
        stroke="#F5F2DD"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M135 206h220l-26 47H164z" fill="#175448" />
      <path d="M169 174h156v36H169z" fill="#F9F5E8" />
      <path d="M184 145h125v31H184z" fill="#F7C769" />
      <path d="M183 137h131l9 9H176z" fill="#21584D" />
      <path d="M244 137v-26" stroke="#21584D" strokeWidth="4" />
      <path d="M246 111l27 7-27 8z" fill="#E78660" />
      <g fill="#67998A">
        <rect x="186" y="185" width="20" height="14" rx="3" />
        <rect x="215" y="185" width="20" height="14" rx="3" />
        <rect x="244" y="185" width="20" height="14" rx="3" />
        <rect x="273" y="185" width="20" height="14" rx="3" />
        <rect x="299" y="185" width="13" height="14" rx="3" />
      </g>
      <path d="M149 216h191" stroke="#F4C465" strokeWidth="5" />
      <path
        d="M71 52q12-12 25 0m326 140q11-11 22 0"
        stroke="#38695C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="124" cy="242" r="5" fill="#F5F2DD" />
      <path
        d="M15 187q12-40 34-30"
        stroke="#38695C"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M26 166q-25-18-18-26 20 1 18 26m1 0q21-31 29-20-6 15-29 20"
        fill="#669788"
      />
    </svg>
  );
}
export function JourneyArt({ kind }: { kind: string }) {
  if (kind === "greetings")
    return (
      <svg viewBox="0 0 300 150" aria-hidden="true">
        <path d="M58 110v-43a31 31 0 0162 0v43" fill="#D5A986" />
        <path d="M165 112V70a29 29 0 0158 0v42" fill="#FAE4C2" />
        <path d="M42 142q44-69 91 0" fill="#417768" />
        <path d="M151 142q47-69 86 0" fill="#DC8564" />
        <circle cx="89" cy="72" r="26" fill="#F3C69E" />
        <circle cx="194" cy="74" r="25" fill="#F3C69E" />
        <path
          d="M66 65q-1-39 25-29 33-5 25 34-12-2-17-20-5 14-33 15"
          fill="#35594F"
        />
        <path d="M171 65q-5-29 23-31 28 1 24 34-29-1-36-15z" fill="#35594F" />
        <g fill="#36594F">
          <circle cx="82" cy="73" r="2" />
          <circle cx="99" cy="73" r="2" />
          <circle cx="187" cy="74" r="2" />
          <circle cx="203" cy="74" r="2" />
        </g>
        <path
          d="M85 84q6 7 12 0m92 1q6 7 12 0"
          fill="none"
          stroke="#855D45"
          strokeWidth="2"
        />
        <path d="M127 21h42v28h-20l-9 9v-9h-13z" fill="white" />
        <text x="148" y="41" textAnchor="middle" fill="#28594C" fontSize="13">
          你好
        </text>
        <path
          d="M244 61l7-10m-5 21h13M41 46l-6-10"
          stroke="#DAA640"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  if (kind === "introductions")
    return (
      <svg viewBox="0 0 300 150" aria-hidden="true">
        <rect x="53" y="34" width="106" height="78" rx="15" fill="#6C91A0" />
        <path d="M77 108v20l22-20" fill="#6C91A0" />
        <rect x="143" y="65" width="108" height="69" rx="15" fill="#F9F7EB" />
        <path d="M210 129v15l-17-15" fill="#F9F7EB" />
        <text x="107" y="82" textAnchor="middle" fill="white" fontSize="27">
          我叫…
        </text>
        <text x="197" y="107" textAnchor="middle" fill="#426477" fontSize="24">
          你好！
        </text>
        <path
          d="M188 30l6-13m-1 23h15M37 112l-8 8"
          stroke="#D3A857"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  if (kind === "manners")
    return (
      <svg viewBox="0 0 300 150" aria-hidden="true">
        <path
          d="M147 128V70m0 41l-35-15m35 1l34-16"
          stroke="#6F9360"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse
          cx="113"
          cy="95"
          rx="25"
          ry="12"
          transform="rotate(26 113 95)"
          fill="#96AD7C"
        />
        <ellipse
          cx="181"
          cy="81"
          rx="25"
          ry="12"
          transform="rotate(-26 181 81)"
          fill="#96AD7C"
        />
        <g fill="#F2CC76">
          <ellipse cx="147" cy="40" rx="14" ry="24" />
          <ellipse
            cx="147"
            cy="40"
            rx="14"
            ry="24"
            transform="rotate(60 147 62)"
          />
          <ellipse
            cx="147"
            cy="40"
            rx="14"
            ry="24"
            transform="rotate(120 147 62)"
          />
          <ellipse
            cx="147"
            cy="40"
            rx="14"
            ry="24"
            transform="rotate(180 147 62)"
          />
          <ellipse
            cx="147"
            cy="40"
            rx="14"
            ry="24"
            transform="rotate(240 147 62)"
          />
          <ellipse
            cx="147"
            cy="40"
            rx="14"
            ry="24"
            transform="rotate(300 147 62)"
          />
        </g>
        <circle cx="147" cy="62" r="19" fill="#FDF6DE" />
        <path
          d="M140 68q7 6 14 0"
          fill="none"
          stroke="#7D7151"
          strokeWidth="2"
        />
        <circle cx="140" cy="59" r="2" fill="#7D7151" />
        <circle cx="154" cy="59" r="2" fill="#7D7151" />
        <text x="224" y="63" fill="#947845" fontSize="17">
          唔該 ♡
        </text>
      </svg>
    );
  return <Harbour />;
}
