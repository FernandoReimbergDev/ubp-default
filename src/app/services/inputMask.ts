export const handleCnpjCpfMask = (
    value: string,
    setValue: (field: string, value: string) => void,
    trigger: (field: string) => void
) => {
    const numericValue = value.replace(/\D/g, '');
    let maskedValue = numericValue;

    if (numericValue.length <= 11) {
        // CPF
        maskedValue = numericValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // CNPJ
        maskedValue = numericValue
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }

    setValue('cnpj_cpf', maskedValue);
    trigger('cnpj_cpf');
};


