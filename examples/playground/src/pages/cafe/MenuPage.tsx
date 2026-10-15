import { useState } from 'react'
import { menu as initialMenu, type MenuItem } from '@/app/data'
import { money } from '@/app/format'
import Menu from '@/views/cafe/pages/Menu.terse'

const CATEGORIES: MenuItem['category'][] = ['Coffee', 'Tea', 'Cold drinks', 'Bakery', 'Food']
const EMPTY = { name: '', price: '', category: '', description: '', image: '' }
type Form = typeof EMPTY

function validate(f: Form, existing: MenuItem[]): Partial<Form> {
  const errors: Partial<Form> = {}
  const price = Number(f.price)
  if (!f.name.trim()) errors.name = 'Give the item a name.'
  else if (existing.some((m) => m.name.toLowerCase() === f.name.trim().toLowerCase())) errors.name = 'An item with this name is already on the menu.'
  if (!f.price) errors.price = 'Enter a price.'
  else if (!Number.isFinite(price) || price <= 0) errors.price = 'Price must be more than ₹0.'
  else if (price > 5000) errors.price = 'That looks too high; prices are in rupees.'
  if (!f.category) errors.category = 'Pick a category.'
  if (f.description.length > 160) errors.description = `Keep it under 160 characters (${f.description.length}).`
  if (f.image) {
    try {
      new URL(f.image)
    } catch {
      errors.image = 'Enter a full URL starting with https://'
    }
  }
  return errors
}

export default function MenuPage() {
  const [items, setItems] = useState(initialMenu)
  const [category, setCategory] = useState('All')
  const [dialogOpen, setDialogOpen] = useState(new URLSearchParams(location.search).has('add'))
  const [form, setForm] = useState<Form>(EMPTY)
  const [submitted, setSubmitted] = useState(new URLSearchParams(location.search).get('add') === 'invalid')

  // Errors show after the first save attempt, then update live as fields change.
  const errors = submitted ? validate(form, items) : {}
  const field = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const close = () => {
    setDialogOpen(false)
    setForm(EMPTY)
    setSubmitted(false)
  }

  const shown = category === 'All' ? items : items.filter((m) => m.category === category)
  const available = shown.filter((m) => m.available).length

  return (
    <Menu
      category={category}
      onCategory={setCategory}
      summary={`${shown.length} items · ${available} available · ${shown.reduce((s, m) => s + m.soldToday, 0)} sold today`}
      items={shown.map((m) => ({
        name: m.name,
        category: m.category,
        price: money(m.price),
        description: m.description,
        image: m.image,
        available: m.available,
        sold: `${m.soldToday} sold today`,
        onToggle: (on: boolean) => setItems((xs) => xs.map((x) => (x.id === m.id ? { ...x, available: on } : x))),
      }))}
      dialogOpen={dialogOpen}
      onDialog={(open: boolean) => (open ? setDialogOpen(true) : close())}
      form={form}
      errors={errors}
      categories={CATEGORIES}
      onName={field('name')}
      onPrice={field('price')}
      onCategoryField={field('category')}
      onDescription={field('description')}
      onImage={field('image')}
      onCancel={close}
      onSave={() => {
        setSubmitted(true)
        if (Object.keys(validate(form, items)).length) return
        const item: MenuItem = {
          id: `m${items.length + 1}`,
          name: form.name.trim(),
          category: form.category as MenuItem['category'],
          price: Number(form.price),
          description: form.description.trim(),
          image: form.image,
          available: true,
          soldToday: 0,
        }
        setItems((xs) => [...xs, item])
        setCategory(item.category)
        close()
      }}
    />
  )
}
