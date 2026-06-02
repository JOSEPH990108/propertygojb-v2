"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  getPhoneCountries,
  getPhoneCountryByCode,
  splitE164Phone,
  type SupportedPhoneCountryCode,
} from "@/lib/auth/otp/phone"
import { cn } from "@/lib/utils"

type PhoneNumberInputProps = {
  id: string
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  ariaInvalid?: boolean
  defaultCountryCode?: SupportedPhoneCountryCode
}

const COUNTRIES = getPhoneCountries()

export function PhoneNumberInput({
  id,
  value,
  onValueChange,
  disabled,
  ariaInvalid,
  defaultCountryCode = "MY",
}: PhoneNumberInputProps) {
  const initialSplit = splitE164Phone(value)

  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState<SupportedPhoneCountryCode>(
    initialSplit?.country.code ?? defaultCountryCode,
  )
  const [nationalNumber, setNationalNumber] = useState(initialSplit?.nationalNumber ?? "")

  const selectedCountry = useMemo(() => {
    return getPhoneCountryByCode(selectedCountryCode) ?? COUNTRIES[0]
  }, [selectedCountryCode])

  const commitValue = (inputCountryCode: SupportedPhoneCountryCode, rawNationalNumber: string) => {
    const country = getPhoneCountryByCode(inputCountryCode)
    if (!country) {
      onValueChange(rawNationalNumber)
      return
    }

    const digits = rawNationalNumber.replace(/\D/g, "")
    const normalizedDigits = country.trimsLeadingZero ? digits.replace(/^0+/, "") : digits

    if (!normalizedDigits) {
      onValueChange("")
      return
    }

    onValueChange(`+${country.dialCode}${normalizedDigits}`)
  }

  return (
    <InputGroup className="h-10">
      <InputGroupAddon align="inline-start" className="border-r border-border/70 pr-1.5">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="combobox"
              aria-expanded={isOpen}
              disabled={disabled}
              className="h-7 gap-1 px-1.5"
            >
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="text-xs font-medium">+{selectedCountry.dialCode}</span>
              <ChevronsUpDown className="size-3 text-muted-foreground" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country or code..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {COUNTRIES.map((country) => {
                    const isSelected = country.code === selectedCountryCode
                    return (
                      <CommandItem
                        key={country.code}
                        value={`${country.name} ${country.code} +${country.dialCode}`}
                        onSelect={() => {
                          setSelectedCountryCode(country.code)
                          setIsOpen(false)
                          commitValue(country.code, nationalNumber)
                        }}
                      >
                        <span className="text-base leading-none">{country.flag}</span>
                        <span>{country.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">+{country.dialCode}</span>
                        <Check className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>

      <InputGroupInput
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={nationalNumber}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "")
          setNationalNumber(digits)
          commitValue(selectedCountryCode, digits)
        }}
        placeholder={selectedCountry.exampleNational}
        disabled={disabled}
        aria-invalid={ariaInvalid}
      />
    </InputGroup>
  )
}
