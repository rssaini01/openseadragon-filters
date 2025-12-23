export const vertexShader = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const brightnessShader = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_adjustment;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  gl_FragColor = vec4(color.rgb + u_adjustment / 255.0, color.a);
}
`;

export const contrastShader = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_adjustment;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  gl_FragColor = vec4(color.rgb * u_adjustment, color.a);
}
`;

export const gammaShader = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_adjustment;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  gl_FragColor = vec4(pow(color.rgb, vec3(u_adjustment)), color.a);
}
`;

export const invertShader = `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  gl_FragColor = vec4(1.0 - color.rgb, color.a);
}
`;

export const greyscaleShader = `
precision mediump float;
uniform sampler2D u_image;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  float grey = (color.r + color.g + color.b) / 3.0;
  gl_FragColor = vec4(vec3(grey), color.a);
}
`;

export const thresholdShader = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_threshold;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  float grey = (color.r + color.g + color.b) / 3.0;
  float value = grey < u_threshold / 255.0 ? 0.0 : 1.0;
  gl_FragColor = vec4(vec3(value), color.a);
}
`;

export const convolutionShader = `
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform float u_kernel[9];
varying vec2 v_texCoord;
void main() {
  vec2 onePixel = vec2(1.0) / u_textureSize;
  vec4 colorSum = 
    texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
    texture2D(u_image, v_texCoord + onePixel * vec2(0, -1)) * u_kernel[1] +
    texture2D(u_image, v_texCoord + onePixel * vec2(1, -1)) * u_kernel[2] +
    texture2D(u_image, v_texCoord + onePixel * vec2(-1, 0)) * u_kernel[3] +
    texture2D(u_image, v_texCoord + onePixel * vec2(0, 0)) * u_kernel[4] +
    texture2D(u_image, v_texCoord + onePixel * vec2(1, 0)) * u_kernel[5] +
    texture2D(u_image, v_texCoord + onePixel * vec2(-1, 1)) * u_kernel[6] +
    texture2D(u_image, v_texCoord + onePixel * vec2(0, 1)) * u_kernel[7] +
    texture2D(u_image, v_texCoord + onePixel * vec2(1, 1)) * u_kernel[8];
  gl_FragColor = vec4(colorSum.rgb, texture2D(u_image, v_texCoord).a);
}
`;

export const colormapShader = `
precision mediump float;
uniform sampler2D u_image;
uniform vec3 u_colorStops[16];
uniform int u_numStops;
uniform float u_centerpoint;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  float grey = (color.r + color.g + color.b) / 3.0;
  float normalized = grey < u_centerpoint / 255.0 
    ? grey / (u_centerpoint / 255.0)
    : (grey - u_centerpoint / 255.0) / (1.0 - u_centerpoint / 255.0);
  float stopIndex = normalized * float(u_numStops - 1);
  int lowerIndex = int(floor(stopIndex));
  int upperIndex = int(ceil(stopIndex));
  float t = fract(stopIndex);
  vec3 mappedColor = mix(u_colorStops[lowerIndex], u_colorStops[upperIndex], t);
  gl_FragColor = vec4(mappedColor, color.a);
}
`;
