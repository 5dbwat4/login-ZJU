function rsaEncrypt(passwd: string, exponent: string, nHex: string): string {
    let pwd = 0n;
    for (const c of passwd) {
        pwd = pwd * 256n + BigInt(c.charCodeAt(0));
    }
    const n = BigInt("0x" + nHex);
    const e = BigInt("0x" + exponent);// 笑点解析：一开始以为10001是十进制，调半天调不对
    const crypt = (pwd ** e) % n;
    // let crypt = 1n;
    // let base = pwd % n;
    // for (let i = 0n; i < e; i++) {
    //     crypt = (crypt * base) % n;
    //     base = (base * base) % n; 
    // } 
    const ciphertextHex = crypt.toString(16);
    return ciphertextHex;
}
export { rsaEncrypt };