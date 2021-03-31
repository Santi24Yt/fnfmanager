export interface File {
  name: string
  directory: string
}

export interface ModData {
  files: Array<File>
  directories: Array<Directory>
}

export interface Directory {
  name: string
  full: string
}

export class Mod
{
  public name: string
  public files: Array<File>
  public directories: Array<Directory>
  public loaded: boolean = false

  public constructor(name: string, files: Array<File>, directories: Array<Directory>, loaded: boolean = false)
  {
    this.name = name
    this.files = files
    this.directories = directories
    this.loaded = loaded
  }

  public printDetails() : void
  {
    console.log(this.name+"\t"+(this.loaded?"(loaded)":""))
  }
}