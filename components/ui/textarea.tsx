import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "rounded-lg border border-input bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/50",
        filled: "rounded-lg border-0 bg-muted focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/80",
        ghost: "rounded-lg border-transparent bg-transparent focus-visible:bg-accent hover:bg-accent/50",
        underlined: "rounded-none border-0 border-b-2 border-input bg-transparent focus-visible:border-primary px-0",
        elite: "rounded-lg border border-purple-500/30 bg-purple-500/5 focus-visible:ring-2 focus-visible:ring-purple-500 hover:border-purple-500/50 hover:bg-purple-500/10",
        glass: "rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-white/30 hover:bg-white/20",
      },
      textSize: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      variant: "default",
      textSize: "default",
      resize: "vertical",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    textSize, 
    resize,
    error,
    errorMessage,
    label,
    helperText,
    maxLength,
    showCount,
    value,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = React.useState(0)
    
    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length)
      }
    }, [value])
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      props.onChange?.(e)
    }
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({ variant, textSize, resize }),
              "min-h-[80px] px-3 py-2",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            ref={ref}
            value={value}
            maxLength={maxLength}
            onChange={handleChange}
            {...props}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5">
          <div>
            {error && errorMessage && (
              <p className="text-xs text-red-500">{errorMessage}</p>
            )}
            {!error && helperText && (
              <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
          </div>
          {showCount && maxLength && (
            <span className={cn(
              "text-xs text-muted-foreground",
              charCount >= maxLength && "text-red-500"
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// Auto-resizing textarea
interface AutoResizeTextareaProps extends TextareaProps {
  minRows?: number;
  maxRows?: number;
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ minRows = 2, maxRows = 10, className, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
    
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      
      textarea.style.height = 'auto'
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const minHeight = lineHeight * minRows
      const maxHeight = lineHeight * maxRows
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`
    }, [minRows, maxRows])
    
    React.useEffect(() => {
      adjustHeight()
    }, [props.value, adjustHeight])
    
    return (
      <Textarea
        ref={(node) => {
          textareaRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={cn("overflow-hidden", className)}
        resize="none"
        onInput={adjustHeight}
        {...props}
      />
    )
  }
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { Textarea, AutoResizeTextarea }
