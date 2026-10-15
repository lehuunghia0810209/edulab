const frame = (id, content) => `<svg class="science-art art-${id}" viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle class="art-guide" cx="180" cy="130" r="112"/><circle class="art-guide" cx="180" cy="130" r="88" stroke-dasharray="2 12"/>
  <path class="art-guide" d="M28 130H62M298 130H332M180 12V30M180 230V248"/>
  ${content}<text class="art-caption" x="26" y="246">EDULAB / ${id.toUpperCase()}</text>
</svg>`;

export const LAB_ILLUSTRATIONS = {
  chemlab: frame('chemlab', `
    <g class="ambient molecule-drift"><path class="art-link" d="M122 104L182 72L240 108L232 170L173 192L118 160Z M122 104L173 135L240 108M173 135V192"/>
      <circle class="art-atom" cx="122" cy="104" r="16"/><circle class="art-atom" cx="182" cy="72" r="11"/>
      <circle class="art-atom" cx="240" cy="108" r="14"/><circle class="art-atom" cx="232" cy="170" r="10"/>
      <circle class="art-atom" cx="173" cy="192" r="14"/><circle class="art-atom" cx="118" cy="160" r="10"/><circle class="art-nucleus" cx="173" cy="135" r="7"/>
    </g>
    <g class="ambient orbit-electron"><ellipse class="art-orbit" cx="180" cy="130" rx="137" ry="63" transform="rotate(-25 180 130)"/><circle class="art-spark" cx="304" cy="75" r="5"/></g>
    <g class="ambient orbit-electron reverse"><circle class="art-orbit" cx="180" cy="130" r="105"/><circle class="art-spark" cx="180" cy="25" r="4"/></g>`),
  physicslab: frame('physicslab', `
    <path class="art-guide" d="M30 146H330M70 50V210"/>
    <path class="art-wave ambient wave-flow" d="M28 146C53 66 78 66 103 146S153 226 178 146S228 66 253 146S303 226 328 146"/>
    <path class="art-wave wave-secondary ambient wave-flow" d="M28 146C53 196 78 196 103 146S153 96 178 146S228 196 253 146S303 96 328 146"/>
    <g class="ambient pendulum"><path class="art-link" d="M180 42V140"/><circle class="art-atom" cx="180" cy="150" r="16"/></g>
    <circle class="art-spark" cx="180" cy="42" r="5"/><path class="art-guide" d="M140 42H220"/>`),
  mathlab: frame('mathlab', `
    <path class="art-guide" d="M42 204H316M65 222V32M65 164H308M65 124H308M65 84H308"/>
    <path class="art-wave ambient graph-trace" d="M44 194C88 188 90 130 136 142S190 190 220 113S264 65 314 40"/>
    <g class="ambient geometry-turn"><path class="art-link" d="M180 42L258 90L243 181L155 207L98 133Z M180 42L243 181L98 133L258 90L155 207Z"/><circle class="art-spark" cx="180" cy="42" r="5"/><circle class="art-atom" cx="243" cy="181" r="8"/></g>`),
  biolab: frame('biolab', `
    <path class="art-orbit" d="M114 30C284 75 76 190 246 230M246 30C76 75 284 190 114 230"/>
    ${Array.from({length:12}, (_,i) => {
      const y=37+i*17;
      const span=22+Math.abs(Math.cos(i*.42))*49;
      return `<g class="ambient dna-rung" style="--strand-delay:${-i*.28}s"><path class="art-link" d="M${180-span} ${y}H${180+span}"/><circle class="art-atom" cx="${180-span}" cy="${y}" r="6"/><circle class="art-spark" cx="${180+span}" cy="${y}" r="4"/></g>`;
    }).join('')}`),
  itlab: frame('itlab', `
    <g class="art-circuit"><path class="art-guide" d="M28 68H94L134 108H180M28 198H96L140 154M332 62H264L222 106M332 192H266L222 150M180 24V88M180 174V234"/>
    <path class="art-wave ambient data-travel" d="M28 68H94L134 108H180M28 198H96L140 154M332 62H264L222 106M332 192H266L222 150M180 24V88M180 174V234"/></g>
    <rect class="art-link" x="132" y="83" width="96" height="96" rx="22"/><rect class="art-orbit" x="145" y="96" width="70" height="70" rx="14"/>
    <g class="ambient processor-breathe"><path class="art-wave" d="M170 117L157 131L170 145M190 117L203 131L190 145"/><path class="art-link" d="M186 112L176 150"/></g>
    <circle class="art-spark" cx="28" cy="68" r="4"/><circle class="art-spark" cx="332" cy="192" r="4"/>`),
};

export const ORBIT_MOTIF = `<svg class="orbit-motif" viewBox="0 0 360 260" fill="none" aria-hidden="true">
  <g class="ambient motif-orbit"><ellipse cx="180" cy="130" rx="146" ry="69"/><circle cx="326" cy="130" r="5"/></g>
  <g class="ambient motif-orbit reverse"><ellipse cx="180" cy="130" rx="114" ry="90" transform="rotate(44 180 130)"/><circle cx="68" cy="130" r="4"/></g>
  <circle class="motif-center" cx="180" cy="130" r="30"/><path d="M168 130H192M180 118V142"/>
</svg>`;
