const ALERT_COOLDOWN_MS = 60_000;

export const ALERT_CONDITIONS = ['above', 'below', 'outside'];

export const DEFAULT_DATA_TYPES = [
  'temperature',
  'humidity',
  'motion',
  'soil_moisture',
  'pressure',
  'internal_temp',
];

export function inferCondition(alert) {
  if (alert.condition && ALERT_CONDITIONS.includes(alert.condition)) {
    return alert.condition;
  }
  if (alert.min != null && alert.max != null) return 'outside';
  if (alert.min != null) return 'below';
  if (alert.max != null) return 'above';
  return 'outside';
}

export function isAlertTriggered(alert, value) {
  const v = Number(value);
  if (Number.isNaN(v)) return false;

  const condition = inferCondition(alert);

  switch (condition) {
    case 'above':
      return alert.max != null && v > Number(alert.max);
    case 'below':
      return alert.min != null && v < Number(alert.min);
    case 'outside': {
      const below = alert.min != null && v < Number(alert.min);
      const above = alert.max != null && v > Number(alert.max);
      return below || above;
    }
    default:
      return false;
  }
}

export function formatAlertCriteria(alert) {
  const condition = inferCondition(alert);
  const type = alert.datatype || 'reading';
  const sensor = alert.sensor?.name || 'sensor';

  switch (condition) {
    case 'above':
      return `${type} on ${sensor} goes above ${alert.max}`;
    case 'below':
      return `${type} on ${sensor} falls below ${alert.min}`;
    case 'outside':
      if (alert.min != null && alert.max != null) {
        return `${type} on ${sensor} goes outside ${alert.min}–${alert.max}`;
      }
      if (alert.min != null) return `${type} on ${sensor} falls below ${alert.min}`;
      if (alert.max != null) return `${type} on ${sensor} goes above ${alert.max}`;
      return `${type} on ${sensor} (incomplete range)`;
    default:
      return `${type} on ${sensor}`;
  }
}

export function validateAlertPayload(body) {
  const name = (body.name || '').trim();
  const sensorName = body.sensor;
  const datatype = (body.datatype || '').trim();
  const alertEmail = (body.alertEmail || body.email || '').trim();
  const condition = body.condition || inferCondition(body);
  const min = body.min === '' || body.min == null ? null : Number(body.min);
  const max = body.max === '' || body.max == null ? null : Number(body.max);

  if (!name) return { err: 'Alert name is required' };
  if (!sensorName) return { err: 'Sensor is required' };
  if (!datatype) return { err: 'Data type is required' };
  if (!alertEmail) return { err: 'Alert email is required' };
  if (!ALERT_CONDITIONS.includes(condition)) {
    return { err: 'Invalid alert condition' };
  }

  if (condition === 'above') {
    if (max == null || Number.isNaN(max)) {
      return { err: 'Enter the value the reading must go above' };
    }
    return { ok: true, data: { name, sensorName, datatype, alertEmail, condition, min: null, max } };
  }

  if (condition === 'below') {
    if (min == null || Number.isNaN(min)) {
      return { err: 'Enter the value the reading must fall below' };
    }
    return { ok: true, data: { name, sensorName, datatype, alertEmail, condition, min, max: null } };
  }

  if (min == null || max == null || Number.isNaN(min) || Number.isNaN(max)) {
    return { err: 'Enter both the low and high limits of the safe range' };
  }
  if (min >= max) {
    return { err: 'Low limit must be less than high limit' };
  }

  return { ok: true, data: { name, sensorName, datatype, alertEmail, condition, min, max } };
}

export async function processAlertsForReading(prisma, { sensorId, type, value }) {
  const alerts = await prisma.alert.findMany({
    where: {
      sensorId,
      datatype: type,
    },
    include: { sensor: { select: { name: true } } },
  });

  const triggered = [];

  for (const alert of alerts) {
    if (!isAlertTriggered(alert, value)) continue;

    const recent = await prisma.alertEvent.findFirst({
      where: {
        alertId: alert.id,
        triggeredAt: { gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
      },
      orderBy: { triggeredAt: 'desc' },
    });

    if (recent) continue;

    const event = await prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        value: Number(value),
      },
      include: {
        alert: {
          include: { sensor: { select: { name: true } } },
        },
      },
    });

    triggered.push(event);
  }

  return triggered;
}
