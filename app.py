import eel


eel.init('web')

# In the future, add functions for snipping, saving, etc. and expose them to the frontend using @eel.expose

eel.start('index.html', size=(600, 400), block=True)