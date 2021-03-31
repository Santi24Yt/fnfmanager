import * as inquirer from "inquirer"
import { readdirSync, lstatSync, Stats, existsSync, readFileSync, writeFileSync } from "fs"
import * as path from "path"
import chalk from "chalk"
import { Mod, File, ModData, Directory } from "./mod"
import { copySync, ensureDirSync, removeSync } from "fs-extra"

__dirname = "C:\\Users\\Toshiba\\Documents\\FunkinMulti"

ensureDirSync(path.join(__dirname, "/mods/fnfmanager"))

let allmods: Array<Mod> = []

function getModData(dir: string) : ModData
{
  let directories: Array<Directory> = []
  let files: Array<File> = []
  let dirs = readdirSync(dir)
  let d : string
  for(d of dirs)
  {
    let stats : Stats = lstatSync(path.join(dir,d))
    if(stats.isDirectory())
    {
      directories.push({name: d, full: path.join(dir,d)})
      let r : ModData = getModData(path.join(dir,d))
      r.directories.forEach(d => directories.push({name: d.name, full: d.full}))
      r.files.filter(f => !files.includes(f)).forEach(f => files.push(f))
    }else{
      files.push({name: d, directory: path.join(dir,d)})
    }
  }
  return {files: files, directories: directories}
}

function readMods(dir: string = "mods/fnfmanager") : void
{
  allmods = []
  let mods: Array<string> = readdirSync(path.join(__dirname, dir))
  let modn: string
  if(!mods.includes("default"))
  {
    getDefault()
    mods.push("default")
  }
  if(!existsSync(path.join(__dirname,"/mods/fnfmanagerData.json")))
  {
    writeFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"),"{}")
  }
  let rawData: string = readFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"),"utf-8")
  let parsedData: any = JSON.parse(rawData)
  for (modn of mods) 
  {
    let stats: Stats = lstatSync(path.join(__dirname, dir, modn))
    if (stats.isDirectory()) 
    {
      let modData: ModData = getModData(path.join(__dirname, dir, modn))
      let files: Array<File> = modData.files
      let directories: Array<Directory> = modData.directories
      let loaded: boolean = parsedData[modn]
      if(!loaded)  
      {
        loaded = false
      }   
      allmods.push(new Mod(modn, files, directories, loaded))
    }
  }
  
}

function getDefault() : void
{
  copySync(path.join(__dirname,"assets"),path.join(__dirname, "mods/fnfmanager", "default", "assets"), {overwrite:false})
}

readMods()

function displayModList() : void
{
  console.log(chalk.gray("- "+allmods.length+" mod(s) detected"))
  allmods.forEach(m => m.printDetails())
}

function promptAdd() : void
{
  console.clear()
  inquirer.prompt({
    type: "input",
    name: "add",
    message: "Add the directory of the mod to add"
  }).then(ans =>{
    if(ans["add"] != "")
    {
      let dir: string = ans["add"]
      let name: string = dir.split("\\").pop() || "nomodname"
      if(existsSync(dir))
      {
        copySync(dir, path.join(__dirname, "mods/fnfmanager/", name), {overwrite: true})
        readMods()
      }
    }
    promptUser()
  })
}

function promptDelete() : void
{
  console.clear()
  let choices = allmods.filter(m => m.name != "default").filter(m => !m.loaded).map((m,i) => ({name:m.name, value: i}))
  inquirer.prompt({
    type: "checkbox",
    name: "delete",
    message: "Select mods to delete them",
    choices: choices
  }).then(ans => {
    let del: Array<number> = ans["delete"] as Array<number>
    del.forEach(n => {
      removeSync(path.join(__dirname, "mods/fnfmanager", choices[n].name))
    })
    readMods()
    promptUser()
  })
}

function promptLoad() : void
{
  console.clear()
  let choices = allmods.filter(m => m.name != "default").filter(m => !m.loaded).map((m,i) => ({name:m.name, value: i}))
  choices.push({name:"Back",value:choices.length})
  inquirer.prompt({
    type: "list",
    name: "load",
    choices: choices
  }).then(ans => {
    let load: number = ans["load"]
    let loadN: string = choices[load].name
    if(loadN != "Back")
    {
      loadMod(loadN)
    }
    promptUser()
  })
}

function loadMod(name: string)
{
  let mod = allmods.find(m => m.name == name)
  if(!mod) throw new Error("Missing mod")
  mod.files.forEach(f =>{
    copySync(f.directory, path.join(__dirname, f.directory.split(name).slice(1).join(name)),{overwrite: true})
  })
  mod.loaded = true
  let rawData: string = readFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"),"utf-8")
  let parsedData: any = JSON.parse(rawData)
  parsedData[name] = true
  writeFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"), JSON.stringify(parsedData))
}

function promptUnload() : void
{
  console.clear()
  let choices = allmods.filter(m => m.loaded).map((m,i) => ({name:m.name, value: i}))
  choices.push({name:"Back",value:choices.length})
  inquirer.prompt({
    type: "list",
    name: "unload",
    choices: choices
  }).then(ans => {
    let unload: number = ans["unload"]
    let unloadN: string = choices[unload].name
    if(unloadN != "Back")
    {
      unloadMod(unloadN)
    }
    promptUser()
  })
}

function unloadMod(name: string) : void
{
  let mod: Mod|undefined = allmods.find(m => m.name == name)
  let def: Mod|undefined = allmods.find(m => m.name == "default")
  if(!mod) throw new Error("Missing mod")
  if(!def)
  {
    readMods()
  }
  mod.files.forEach(f =>{
    let defFile = def?.files.find(df => df.name == f.name)
    if(defFile)
    {
      copySync(defFile.directory, path.join(__dirname, f.directory.split(name).slice(1).join(name)),{overwrite: true})
    }
  })
  mod.loaded = false
  let rawData: string = readFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"),"utf-8")
  let parsedData: any = JSON.parse(rawData)
  parsedData[name] = false
  writeFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"), JSON.stringify(parsedData))
}

function restoreDefault() : void
{
  let def: Mod|undefined = allmods.find(m => m.name == "default")
  if(!def)
  {
    readMods()
  }
  def?.files.forEach(f => {
    copySync(f.directory, path.join(__dirname, f.directory.split("default").slice(1).join("default")),{overwrite: true})
  })
  allmods.forEach(m => m.loaded = false)
  let rawData: string = readFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"),"utf-8")
  let parsedData: any = JSON.parse(rawData)
  Object.keys(parsedData).forEach(d => parsedData[d] = false)
  writeFileSync(path.join(__dirname,"/mods/fnfmanagerData.json"), JSON.stringify(parsedData))
  promptUser()
}

enum Commands
{
  Add = "Add mod from directory",
  Load = "Load mod to game",
  Unload = "Unload mod if loaded",
  Delete = "Delete mods",
  Default = "Restore default",
  Quit = "Quit/Exit"
}

function promptUser () : void
{
  console.clear()
  console.log(chalk.bold.italic.underline("Friday Night Funkin' Multiplayer Mod Manager"))
  displayModList()
  inquirer.prompt({
    type: "list",
    name: "command",
    message: "Choose an option",
    choices: Object.values(Commands)
  }).then(ans => {
    switch (ans["command"])
    {
      case Commands.Add:
        promptAdd()
      break;
      case Commands.Delete:
        if(allmods.length > 1)
        {
          promptDelete()
        }else{
          promptUser()
        }
      break;
      case Commands.Load:
        if(allmods.filter(m => !m.loaded).length > 0)
        {
          promptLoad()
        }else{
          promptUser()
        }
      break;
      case Commands.Unload:
        if(allmods.filter(m => m.loaded).length > 0)
        {
          promptUnload()
        }else{
          promptUser()
        }
      break;
      case Commands.Default:
        restoreDefault()
      break;
    }
  })
}
promptUser()