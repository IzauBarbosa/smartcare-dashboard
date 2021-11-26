import React, { useEffect, useState } from 'react'
import {
  CRow,
  CCol,
  CButton,
  CModal,
  CForm,
  CLabel,
  CInput,
  CTextarea,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import './styles.scss'
import Canvas from '../../components/canvas/Canvas'
import InputSwitch from '../../components/inputSwitch/InputSwitch'
import { request } from '../../services/request'

const Actuator = () => {

  const [readyState, setReadyState] = useState(true) // false 

  // Modals
  const [modalActionVisibleState, setModalActionVisibleState] = useState(false)
  const [modalDataVisibleState, setModalDataVisibleState] = useState(false)
  const [modalDeleteVisibleState, setModalDeleteVisibleState] = useState(false)
  const [modalTriggerVisibleState, setModalTriggerVisibleState] = useState(false)
  
  // Fields
  const [methodSubmitState, setMethodSubmitState] = useState("post")
  const [idState, setIdState] = useState()
  const [nameState, setNameState] = useState("")
  const [coordinateState, setCoordinateState] = useState() // { x, y, percentX, percentY, width, height }
  const [alertState, setAlertState] = useState(false)
  const [alertMessageState, setAlertMessageState] = useState("")
  
  const [loadingRequestState, setLoadingRequestState] = useState(false)
  const dispatch = useDispatch()
  const floorPlanSelector = useSelector(({ floorPlan }) => floorPlan)
  const actuatorsSelector = useSelector(({ actuators }) => actuators || [])
  const [requestResponse, setRequestResponse] = useState(actuatorsSelector)
  
  const handleActuator = ( actuator ) => {
    
    setCoordinateState({ 
      x: actuator.x, 
      y: actuator.y, 
      percentX: actuator.percentX, 
      percentY: actuator.percentY,
      width: actuator.width, 
      height: actuator.height, 
    })
      
    if (actuator.id >= 0) {
      setIdState(actuator.id)
      setNameState(actuator.name)
      setAlertState(actuator.alert)
      setAlertMessageState(actuator.alertMessage)
      setModalActionVisibleState(true)
    } else {
      setMethodSubmitState("post")
      setModalDataVisibleState(true)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoadingRequestState(true)

    const sendData = {...coordinateState}

    if (methodSubmitState !== "post") {
      sendData.id = idState
    }

    sendData.name = nameState
    sendData.alert = alertState
    sendData.alertMessage = alertMessageState

    const response = await request({ 
      method: methodSubmitState, 
      endpoint: `${process.env.REACT_APP_BASE_API_URL}actuators`,
      data: sendData
    })
    
    if (response || true) {
      if (response?.success || true) {
        
        let responseFake
        switch (methodSubmitState) {
          case "put":
            responseFake = actuatorsSelector.map((actuator) => {
              if (actuator.id === sendData.id) {
                return sendData
              }
              return actuator
            })
            break;
          case "delete":
            responseFake = actuatorsSelector.filter((actuator) => actuator.id !== sendData.id)
            break;
          default:
            responseFake = [...actuatorsSelector, { id: actuatorsSelector.length, ...sendData}]
            break;
        }

        setRequestResponse(response?.data?.actuators ?? responseFake)
      } else {
        (response?.errors || []).foreach(error => {
          toast.error(`${error} 🤯`)
        })
      }
    }

    setModalDataVisibleState(false)
    setModalDeleteVisibleState(false)
    setLoadingRequestState(false)
  }

  const handleActive = async (e) => {
    e.preventDefault()

    setLoadingRequestState(true)

    const response = await request({ 
      method: methodSubmitState, 
      endpoint: `${process.env.REACT_APP_BASE_API_URL}active-actuator`,
      data: {
        id: idState
      }
    })
    
    if (response || true) {
      if (response?.success || true) {
        toast.error("Atuador acionado com sucesso! 👌")
      } else {
        (response?.errors || []).foreach(error => {
          toast.error(`${error} 🤯`)
        })
      }
    }

    setModalTriggerVisibleState(false)
    setLoadingRequestState(false)
  }

  useEffect(() => {
    // Reset fields
    if (!(modalActionVisibleState || modalDataVisibleState || modalDeleteVisibleState || modalTriggerVisibleState)) {
      setMethodSubmitState("post")
      setIdState()
      setNameState("")
      setCoordinateState()
      setAlertState(false)
      setAlertMessageState("")
    }
  }, [modalActionVisibleState, modalDataVisibleState, modalDeleteVisibleState, modalTriggerVisibleState])

  // useEffect(() => {
  //   const load = async () => {
  //     const response = await request({ 
  //       method: "get", 
  //       endpoint: `${process.env.REACT_APP_BASE_API_URL}actuators`
  //     })
  
  //     if (response || true) {
  //       if (response?.success || true) {
  //         setRequestResponse(response?.data?.actuators)
  //       } else {
  //         (response?.errors || []).foreach(error => {
  //           toast.error(`${error} 🤯`)
  //         })
  //       }
  //     }
      
  //     setReadyState(true)
  //   }

  //   load()
  // }, [])

  useEffect(() =>  {
    dispatch({ type: 'set', actuators: requestResponse })
  }, [requestResponse, dispatch])

  return (
    <div className="smtc-actuator">
      {readyState && floorPlanSelector &&
      <>
        <div className="smtc-actuator-wrapper">
          <div className="smtc-actuator-body">
            <Canvas
              data={actuatorsSelector}
              floorPlan={floorPlanSelector}
              callbackCoordinate={handleActuator}
              resetDraw={!(modalActionVisibleState || modalDataVisibleState || modalDeleteVisibleState || modalTriggerVisibleState)}
            />
          </div>
        </div>
        <CModal centered={true} show={modalDataVisibleState} onClose={() => {
          setModalDataVisibleState(false)
        }}>
          <CForm onSubmit={handleSubmit}>
            <CModalHeader>
              <CModalTitle>Informe os dados do sensor!</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <CRow className="mb-3 align-items-center">
                <CCol className="col-12">
                  <CLabel htmlFor="create-name">Nome</CLabel>
                </CCol>
                <CCol className="col-12">
                  <CInput type="text" placeholder="Nome" id="create-name" onChange={({ target: { value } }) => setNameState(value) } value={nameState} required />
                </CCol>
              </CRow>
              <hr />
              <CRow className="mb-3 align-items-center">
                <CCol className="col-2">
                  <CLabel htmlFor="create-alert">Alerta</CLabel>
                </CCol>
                <CCol className="col-8">
                  <InputSwitch
                    id="create-alert"
                    checked={alertState}
                    onChange={setAlertState}
                  />
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol className="col-12">
                  <CLabel htmlFor="create-message">Mensagem</CLabel>
                </CCol>
                <CCol className="col-12">
                  <CTextarea placeholder="Mensagem" id="create-message" onChange={({ target: { value } }) => setAlertMessageState(value) } value={alertMessageState} rows="3"></CTextarea>
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => {
                if (methodSubmitState === "put") {
                  setModalActionVisibleState(true)
                }
                setModalDataVisibleState(false)
              }}>
                Cancelar
              </CButton>
              <CButton type="submit" color="primary" className={`${loadingRequestState ? "loading" : ""}`} disabled={loadingRequestState}>
                {methodSubmitState === "put" ? "Atualizar" : "Adicionar"}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
        <CModal centered={true} show={modalActionVisibleState} onClose={() => setModalActionVisibleState(false)}>
          <CModalHeader>
            <CModalTitle>Escolha a ação desejada para <strong>({nameState})</strong>!</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Por favor, escolha uma ação abaixo para dar continuidade.
          </CModalBody>
          <CModalFooter>
            <CButton type="button" color="secondary" onClick={() => setModalActionVisibleState(false)}>
              Cancelar
            </CButton>
            <CButton type="button" color="primary" onClick={() => {
              setMethodSubmitState("put")
              setModalDataVisibleState(true)
              setModalActionVisibleState(false)
            }}>Atualizar</CButton>
            <CButton type="button" color="warning" onClick={() => {
              setMethodSubmitState("post")
              setModalTriggerVisibleState(true)
              setModalActionVisibleState(false)
            }}>Ativar</CButton>
            <CButton type="button" color="danger" onClick={() => {
              setMethodSubmitState("delete")
              setModalDeleteVisibleState(true)
              setModalActionVisibleState(false)
            }}>Deletar</CButton>
          </CModalFooter>
        </CModal>
        <CModal centered={true} show={modalDeleteVisibleState} onClose={() => setModalDeleteVisibleState(false)}>
          <CModalHeader>
            <CModalTitle>Tem certeza?</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Ao confirmar a ação, o sensor será excluído do sistema.
          </CModalBody>
          <CModalFooter>
            <CButton type="button" color="secondary" onClick={() => {
              setModalActionVisibleState(true)
              setModalDeleteVisibleState(false)
            }}>
              Voltar
            </CButton>
            <CButton color="primary" type="button" className={`${loadingRequestState ? "loading" : ""}`} disabled={loadingRequestState} onClick={handleSubmit}>Confirmar</CButton>
          </CModalFooter>
        </CModal>
        <CModal centered={true} show={modalTriggerVisibleState} onClose={() => setModalTriggerVisibleState(false)}>
          <CModalHeader>
            <CModalTitle>Tem certeza?</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Ao confirmar a ação, o sensor será ativado na residência.
          </CModalBody>
          <CModalFooter>
            <CButton type="button" color="secondary" onClick={() => {
              setModalActionVisibleState(true)
              setModalTriggerVisibleState(false)
            }}>
              Voltar
            </CButton>
            <CButton color="primary" type="button" className={`${loadingRequestState ? "loading" : ""}`} disabled={loadingRequestState} onClick={handleActive}>Confirmar</CButton>
          </CModalFooter>
        </CModal>
      </>
      }
      {!floorPlanSelector && 
        <CModal centered={true} show={true}>
          <CModalHeader>
            <CModalTitle>Por favor, cadastre uma planta baixa</CModalTitle>
          </CModalHeader>
          <CModalBody>
            Para utilizar este recurso do sistema é necessário que cadastre uma planta baixa da residência em que o paciente se encontra.
          </CModalBody>
        </CModal>
      }
    </div>
  )
}

export default Actuator