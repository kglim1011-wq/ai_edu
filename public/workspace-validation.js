const string = (value,max) => typeof value === 'string' && value.length <= max;
const date = value => string(value,10) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
const time = value => string(value,5) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function validWorkspace(data) {
  if (!data || data.version !== 1 || !['tasks','events','docs'].every(key=>Array.isArray(data[key]) && data[key].length <= 2000)) return false;
  if (!['tasks','events','docs'].every(key=>new Set(data[key].map(item=>item?.id)).size === data[key].length)) return false;
  const common = item => item && string(item.id,100) && string(item.title,120) && item.title.trim().length > 0;
  return data.tasks.every(t=>common(t) && date(t.date) && string(t.project,60) && ['high','medium','low'].includes(t.priority) && typeof t.done === 'boolean') &&
    data.events.every(e=>common(e) && date(e.date) && time(e.time) && time(e.end) && e.end > e.time && string(e.place,100) && ['green','violet','peach'].includes(e.color)) &&
    data.docs.every(d=>common(d) && string(d.category,40) && string(d.content,50000) && string(d.updated,40) && !Number.isNaN(Date.parse(d.updated)));
}
