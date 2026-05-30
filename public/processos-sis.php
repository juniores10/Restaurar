<?php session_start(); ?>
<!DOCTYPE html>
<html lang="pt_br">

<head>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
     <meta name="description" content="Profsa Informática - Gerenciamento de Colaboradores" />
     <meta name="author" content="Paulo Rogério Souza" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />

     <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet" type="text/css" />
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400" rel="stylesheet" type="text/css" />

     <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.css">

     <link rel="shortcut icon" href="https://www.profsa.com.br/pallas56/img/logo-00.png" />

     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

     <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous">
     </script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
          integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous">
     </script>

     <script type="text/javascript" language="javascript"
          src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
     <link href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css" />

     <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
     <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Processos - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {
     var alt = $(window).height();
     var lar = $(window).width();

     $('#men-2').css('height', $('#men-3').height() + 'px');

     $('#upl_b').bind("click", function() {
          $('#doc_b').click();
          $('#lis_b').html('');
     });

     $('#doc_b').change(function() {
          var cam = $('#doc_b').val();
          $('#lit_b').text(cam.replace(/^.*\\/, ""));
          arq_f = new FormData();
          arq_f.append('arq-imp', $('#doc_b').prop('files')[0]);
          $.ajax({
               url: 'ajax/imp-dad-banco.php?cam=' + cam,
               data: arq_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#ope_i').val(1);
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de arquivo solicitado"
                    );
               }
          });
     });

     $("#car_b").click(function() {
          if ($('#ope_i').val() != 1) {
               alert('Não foi feito UpLoad do arquivo para ser efetuado o carregamento');
          } else {
               $('.ima-4').css("display", "block");
               $.getJSON("ajax/imp-car-banco.php", {
                         ope: $('#ope_i').val()
                    })
                    .done(function(data) {
                         if (data.men != "") {
                              $('.ima-4').css("display", "none");
                              alert(data.men);
                         } else {
                              $('#ope_i').val(2);
                              $('#lis_b').html(data.txt);
                              $('.ima-4').css("display", "none");
                              $('#men-2').css('height', $('#men-3').height() + 'px');
                         }
                    }).fail(function(data) {
                         console.log('Erro: ' + JSON.stringify(data));
                         alert("Erro ocorrido no carregamento de dados importados no sistema");
                    });
          }
     });

     $("#gra_b").click(function() {
          if ($('#ope_i').val() <= 1) {
               alert('Não foi feito UpLoad/Carregamento do arquivo para ser gravado');
          } else {
               $('.ima-4').css("display", "block");
               $.getJSON("ajax/imp-gra-banco.php", {
                         ope: $('#ope_i').val()
                    })
                    .done(function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#ope_i').val(0);
                              alert(data.avi);
                              $('#lis_b').html('');
                              $('#lit_b').text(data.avi);
                              $('.ima-4').css("display", "none");
                              $('#men-2').css('height', $('#men-3').height() + 'px');
                         }
                    }).fail(function(data) {
                         console.log('Erro: ' + JSON.stringify(data));
                         alert("Erro ocorrido na gravação de dados importados no sistema");
                    });
          }
     });

     $('#upl_e').bind("click", function() {
          $('#doc_e').click();
          $('#lis_e').html('');
     });

     $('#doc_e').change(function() {
          var cam = $('#doc_e').val();
          $('#lit_e').text(cam.replace(/^.*\\/, ""));
          arq_f = new FormData();
          arq_f.append('arq-imp', $('#doc_e').prop('files')[0]);
          $.ajax({
               url: 'ajax/imp-dad-escala.php?cam=' + cam,
               data: arq_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#ope_i').val(1);
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de arquivo solicitado"
                    );
               }
          });
     });

     $("#car_e").click(function() {
          if ($('#ope_i').val() != 1) {
               alert('Não foi feito UpLoad do arquivo para ser efetuado o carregamento');
          } else {
               $('.ima-4').css("display", "block");
               $.getJSON("ajax/imp-car-escala.php", {
                         ope: $('#ope_i').val()
                    })
                    .done(function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#ope_i').val(2);
                              $('#lis_e').html(data.txt);
                              $('.ima-4').css("display", "none");
                              $('#men-2').css('height', $('#men-3').height() + 'px');
                         }
                    }).fail(function(data) {
                         console.log('Erro: ' + JSON.stringify(data));
                         alert("Erro ocorrido no carregamento de dados importados no sistema");
                    });
          }
     });

     $("#gra_e").click(function() {
          if ($('#ope_i').val() <= 1) {
               alert('Não foi feito UpLoad/Carregamento do arquivo para ser gravado');
          } else {
               $('.ima-4').css("display", "block");
               $.getJSON("ajax/imp-gra-escala.php", {
                         ope: $('#ope_i').val()
                    })
                    .done(function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#ope_i').val(0);
                              alert(data.avi);
                              $('#lis_e').html('');
                              $('#lit_e').text(data.avi);
                              $('.ima-4').css("display", "none");
                              $('#men-2').css('height', $('#men-3').height() + 'px');
                         }
                    }).fail(function(data) {
                         console.log('Erro: ' + JSON.stringify(data));
                         alert("Erro ocorrido na gravação de dados importados no sistema");
                    });
          }
     });

     $('#upl_p').bind("click", function() {
          $('#doc_p').click();
          $('#lis_p').html('');
     });

     $('#doc_p').change(function() {
          var cam = $('#doc_p').val();
          $('#lit_p').text(cam.replace(/^.*\\/, ""));
          arq_f = new FormData();
          arq_f.append('arq-imp', $('#doc_p').prop('files')[0]);
          $.ajax({
               url: 'ajax/imp-dad-producao.php?cam=' + cam,
               data: arq_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#ope_i').val(1);
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de arquivo solicitado"
                    );
               }
          });
     });

     $("#car_p").click(function() {
          if ($('#ope_i').val() != 1) {
               alert('Não foi feito UpLoad do arquivo para ser efetuado o carregamento');
          } else {
               $('.ima-4').css("display", "block");
               $.getJSON("ajax/imp-car-producao.php", {
                         ope: $('#ope_i').val()
                    })
                    .done(function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#ope_i').val(2);
                              $('#lis_p').html(data.txt);
                              $('.ima-4').css("display", "none");
                              $('#men-2').css('height', $('#men-3').height() + 'px');
                         }
                    }).fail(function(data) {
                         console.log('Erro: ' + JSON.stringify(data));
                         alert("Erro ocorrido no carregamento de dados importados no sistema");
                    });
          }
     });

     $("#gra_p").click(function() {
          if ($('#ope_i').val() <= 1) {
               alert('Não foi feito UpLoad/Carregamento do arquivo para ser gravado');
          } else {
               $('.ima-4').css("display", "block");
               $.getJSON("ajax/imp-gra-producao.php", {
                         ope: $('#ope_i').val()
                    })
                    .done(function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#ope_i').val(0);
                              alert(data.avi);
                              $('#lis_p').html('');
                              $('#lit_p').text(data.avi);
                              $('.ima-4').css("display", "none");
                              $('#men-2').css('height', $('#men-3').height() + 'px');
                         }
                    }).fail(function(data) {
                         console.log('Erro: ' + JSON.stringify(data));
                         alert("Erro ocorrido na gravação de dados importados no sistema");
                    });
          }
     });

     $(window).scroll(function() {
          if ($(this).scrollTop() > 100) {
               $(".subir").fadeIn(500);
          } else {
               $(".subir").fadeOut(250);
          }
     });

     $(".subir").click(function() {
          $topo = $("#box00").offset().top;
          $('html, body').animate({
               scrollTop: $topo
          }, 1500);
     });

});
</script>

<?php
     $ret = 0; 
     include_once "dados.php";
     include_once "profsa.php";
     date_default_timezone_set("America/Sao_Paulo");
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");

     if (isset($_SESSION['wrkcodset']) == false) { $_SESSION['wrkcodset'] = 0; }
     if (isset($_SESSION['wrkdatmov']) == false) { $_SESSION['wrkdatmov'] = ''; }

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div id="men-3" class="col-md-10"><br />
                    <div class="row">
                         <div class="col-md-12">
                              <h3 class="cor-4"><strong>Importações do Sistema</strong></h3>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelImp" name="frmTelImp" action="processos-sis.php" method="POST"
                         enctype="multipart/form-data">
                         <div class="row fun-2">
                              <div class="col-md-9">
                                   <span class="lit-4">Banco de Horas (.CSV)</span><br />
                                   <font id="lit_b" size="2">Lidos: 0 <-> Gravados: 0</font>
                              </div>
                              <div id="upl_b" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-window-maximize fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">UpLoad</font>
                              </div>
                              <div id="car_b" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-upload fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">Carregar</font>
                              </div>
                              <div id="gra_b" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-floppy-o fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">Gravar</font>
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-12">
                                   <div id="lis_b"></div>
                              </div>
                         </div>
                         <br /><br />
                         <div class="row fun-2">
                              <div class="col-md-9">
                                   <span class="lit-4">Escala de Horários (.CSV)</span><br />
                                   <font id="lit_e" size="2">Lidos: 0 <-> Gravados: 0</font>
                              </div>
                              <div id="upl_e" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-window-maximize fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">UpLoad</font>
                              </div>
                              <div id="car_e" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-upload fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">Carregar</font>
                              </div>
                              <div id="gra_e" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-floppy-o fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">Gravar</font>
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-12">
                                   <div id="lis_e"></div>
                              </div>
                         </div>
                         <br /><br />
                         <div class="row fun-2">
                              <div class="col-md-9">
                                   <span class="lit-4">Produtividade de Colaboradores (.CSV)</span><br />
                                   <font id="lit_p" size="2">Lidos: 0 <-> Gravados: 0</font>
                              </div>
                              <div id="upl_p" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-window-maximize fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">UpLoad</font>
                              </div>
                              <div id="car_p" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-upload fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">Carregar</font>
                              </div>
                              <div id="gra_p" class="col-md-1 text-center">
                                   <i class="cur-1 fa fa-floppy-o fa-2x" aria-hidden="true"></i> <br />
                                   <font size="2">Gravar</font>
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-12">
                                   <div id="lis_p"></div>
                              </div>
                         </div>

                         <input type="hidden" id="ope_i" value="0" />
                         <input type="file" id="doc_b" class="bot-3" accept=".csv, .CSV" />
                         <input type="file" id="doc_e" class="bot-3" accept=".csv, .CSV" />
                         <input type="file" id="doc_p" class="bot-3" accept=".csv, .CSV" />
                    </form>
               </div>
          </div>
     </div>
     <div class="row">
          <img class="subir" src="img/subir.png" />
          <img class="ima-4" src="img/preloader-5.gif">
     </div>
</body>

</html>