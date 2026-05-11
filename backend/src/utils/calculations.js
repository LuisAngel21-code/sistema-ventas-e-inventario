const TASA_COMISION = 0.02;
const PORCENTAJE_COSTO_BASE = 1.4;
const PORCENTAJE_SOBREPRECIO_VENDEDOR = 0.5;
const SUELDO_FIJO = 350.00;

function calcularPrecioBase(costo) {
  return Math.round(costo * PORCENTAJE_COSTO_BASE * 100) / 100;
}

function calcularComision(precioBase) {
  return Math.round(precioBase * TASA_COMISION * 100) / 100;
}

function calcularSobreprecio(precioFinal, precioBase) {
  const diferencia = precioFinal - precioBase;
  return diferencia > 0 ? Math.round(diferencia * 100) / 100 : 0;
}

function calcularPagoVendedor(precioBase, precioFinal) {
  const comision = calcularComision(precioBase);
  const sobreprecio = calcularSobreprecio(precioFinal, precioBase);
  const gananciaSobreprecio = Math.round(sobreprecio * PORCENTAJE_SOBREPRECIO_VENDEDOR * 100) / 100;
  const totalPago = Math.round((comision + gananciaSobreprecio + SUELDO_FIJO) * 100) / 100;

  return {
    comision,
    sobreprecio,
    gananciaSobreprecio,
    sueldoFijo: SUELDO_FIJO,
    totalPago
  };
}

function calcularResumenVentas(ventas) {
  let totalVentas = 0;
  let totalComision = 0;
  let totalSobreprecio = 0;
  let totalGananciaSobreprecio = 0;

  for (const v of ventas) {
    totalVentas += Number(v.subtotal) || 0;
    totalComision += (calcularComision(Number(v.precio_base_unitario)) * (Number(v.cantidad) || 1));
    const sp = calcularSobreprecio(Number(v.precio_final_unitario), Number(v.precio_base_unitario));
    totalSobreprecio += sp * (Number(v.cantidad) || 1);
    totalGananciaSobreprecio += Math.round(sp * PORCENTAJE_SOBREPRECIO_VENDEDOR * 100) / 100 * (Number(v.cantidad) || 1);
  }

  totalVentas = Math.round(totalVentas * 100) / 100;
  totalComision = Math.round(totalComision * 100) / 100;
  totalSobreprecio = Math.round(totalSobreprecio * 100) / 100;
  totalGananciaSobreprecio = Math.round(totalGananciaSobreprecio * 100) / 100;

  return {
    totalVentas,
    totalComision,
    totalSobreprecio,
    totalGananciaSobreprecio,
    sueldoFijo: SUELDO_FIJO,
    totalAPagar: Math.round((totalComision + totalGananciaSobreprecio + SUELDO_FIJO) * 100) / 100
  };
}

module.exports = {
  calcularPrecioBase,
  calcularComision,
  calcularSobreprecio,
  calcularPagoVendedor,
  calcularResumenVentas,
  TASA_COMISION,
  PORCENTAJE_COSTO_BASE,
  PORCENTAJE_SOBREPRECIO_VENDEDOR,
  SUELDO_FIJO
};
