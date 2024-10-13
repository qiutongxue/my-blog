const special_en = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g
const special_zh = /[。，【】！￥…（）”“、：]+/g

export function countMarkdownWords(str: string) {
  return str
    .replace(/!\[.*?\]\(.*?\)/g, '') // 替换图片
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // 超链接，保留链接文本
    .replace(/```\w*/g, '') // 代码块
    .replace(/:::\w+\s/g, '') // 提示块

    .replace(special_en, '')
    .replace(special_zh, '')
    .length
}
