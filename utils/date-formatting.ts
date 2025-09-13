export const formatDate = (date: Date | string, format: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date"
  }

  const day = dateObj.getDate().toString().padStart(2, "0")
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")
  const year = dateObj.getFullYear().toString()

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`
    default:
      return `${day}/${month}/${year}`
  }
}

export const formatDateInput = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ""
  }

  // Always return YYYY-MM-DD format for HTML date inputs
  const year = dateObj.getFullYear()
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")
  const day = dateObj.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
}

export const formatDateShort = (date: Date | string, format: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date"
  }

  const day = dateObj.getDate().toString().padStart(2, "0")
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")
  const year = dateObj.getFullYear().toString().slice(-2) // Last 2 digits

  switch (format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`
    default:
      return `${day}/${month}/${year}`
  }
}
