import JsBarcode from 'jsbarcode'

/** Штрихкод CODE128 в svg: на этикетке, в карточке, в сетке печати. */
export function drawBarcode(svg: SVGSVGElement | null | undefined, code: string, options: JsBarcode.Options = {}) {
  if (!svg)
    return
  JsBarcode(svg, code, {
    format: 'CODE128',
    width: 1.6,
    height: 50,
    displayValue: true,
    fontSize: 13,
    margin: 6,
    background: '#ffffff',
    lineColor: '#000000',
    ...options,
  })
}
