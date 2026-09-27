import { useState } from 'react'
import { Button } from '../../components/Button'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { OptionsPanel } from './components/OptionsPanel'
import { PasswordRow } from './components/PasswordRow'
import { StrengthMeter } from './components/StrengthMeter'
import { usePasswordGenerator } from './hooks/usePasswordGenerator'
import { usePasswordOptions } from './hooks/usePasswordOptions'
import { getPoolSize } from './lib/generatePassword'
import type { PasswordCount } from './lib/passwordCount'
import { estimateEntropyBits, getStrength } from './lib/strength'

export default function PasswordGeneratorPage() {
  useDocumentTitle('Password Generator')

  const { options, updateOptions } = usePasswordOptions()
  const [count, setCount] = useState<PasswordCount>('1')
  const { passwords, regenerate } = usePasswordGenerator(options, Number(count))
  const [mainPassword, ...otherPasswords] = passwords

  const entropyBits = estimateEntropyBits(options.length, getPoolSize(options))

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Password Generator</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Passwords are created on your device with the browser's cryptographic random generator. They are never
            sent anywhere or saved.
          </p>
        </div>
        <section
          aria-label="Generated password"
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <PasswordRow password={mainPassword} large />
          <StrengthMeter strength={getStrength(entropyBits)} entropyBits={entropyBits} />
          {otherPasswords.length > 0 && (
            <ul className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              {otherPasswords.map((password, index) => (
                // Passwords are regenerated as a whole list, so the index is a stable key.
                <li key={index}>
                  <PasswordRow password={password} />
                </li>
              ))}
            </ul>
          )}
          <Button onClick={regenerate} className="w-full sm:w-auto">
            Generate new {count === '1' ? 'password' : 'passwords'}
          </Button>
        </section>
        <OptionsPanel options={options} onChange={updateOptions} count={count} onCountChange={setCount} />
      </div>
    </div>
  )
}
