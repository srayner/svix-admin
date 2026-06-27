'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Button } from './ui/button'

const schema = z.object({
  name: z.string().min(1, { message: 'App name is required' }),
})

interface Props {
  currentName: string
  appId: string
  onRename: (name: string) => Promise<void>
}

export function AppSettings({ currentName, appId, onRename }: Props) {
  const [saved, setSaved] = useState(false)

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: currentName } })

  async function handleSubmit({ name }: { name: string }) {
    await onRename(name)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Configure the Svix application this component manages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Save'}
                </Button>
                {saved && <span className="text-sm text-muted-foreground">Saved!</span>}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Application ID</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm font-mono break-all">{appId}</code>
        </CardContent>
      </Card>
    </div>
  )
}
