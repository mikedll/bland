package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
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
	
	staticServe := func(relativePath string, w http.ResponseWriter, req *http.Request) {
		mimeTypes := map[string]string{
			"js": "text/javascript",
			"map": "application/octet-stream",
			"html": "text/html",
		}
		
		bytes, err := ioutil.ReadFile(cwd + "/public/" + relativePath)
		if os.IsNotExist(err) {
			log.Println("File not found: " + relativePath)
			w.WriteHeader(http.StatusNotFound)
			return
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
		
		fmt.Println("Serving static: public/" + relativePath)
		w.Header().Add("Content-Type", mimeType)
		w.Write(bytes)		
	}
	
	public := func(w http.ResponseWriter, req *http.Request) {
		prefix := "/public/"
		relativePath := req.URL.Path[len(prefix):len(req.URL.Path)]
		staticServe(relativePath, w, req)
	}
	
	root := func(w http.ResponseWriter, req *http.Request) {
		staticServe("index.html", w, req)
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
