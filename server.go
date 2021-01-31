package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
	"github.com/qor/render"
	"path/filepath"
	"log"
	"os"
)

func main() {

	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal("Error obtaining executable.")
		return
	}
	
	Render := render.New(&render.Config{
		ViewPaths:     []string{},
		DefaultLayout: "",
		FuncMapMaker:  nil,
	})
	
	root := func(w http.ResponseWriter, req *http.Request) {
		ctx := make(map[string]interface{})
		Render.Execute("index", ctx, req, w)
	}

	public := func(w http.ResponseWriter, req *http.Request) {
		starter := "/public/"
		relativePath := req.URL.Path[len(starter):len(req.URL.Path)]
		
		mimeTypes := map[string]string{
			"js": "text/javascript",
			"map": "application/octet-stream",
		}
		
		ext := filepath.Ext(relativePath)
		fileExt := ext[1:len(ext)]

		var ok bool
		mimeType := ""
		if mimeType, ok = mimeTypes[fileExt]; !ok {
			log.Println("Couldn't find mime type for " + relativePath)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		bytes, err := ioutil.ReadFile(cwd + "/client_public/" + relativePath)
		if os.IsNotExist(err) {
			log.Println("File not found: " + relativePath)
			w.WriteHeader(http.StatusNotFound)
			return
		}
		
		fmt.Println("Serving static: public/" + relativePath)
		w.Header().Add("Content-Type", mimeType)
		w.Write(bytes)
	}
	
	http.Handle("/", http.HandlerFunc(root))
	http.Handle("/public/", http.HandlerFunc(public))

	log.Println("Booting up...")
	
	var addr string = "localhost:8081"
	err = http.ListenAndServe(addr, nil)
	if err != nil {
		log.Fatal("ListenAndServer: ", err)
	}

}
